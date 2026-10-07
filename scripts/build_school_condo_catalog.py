"""Build a reusable condo catalog and calculate school distances within 2 km."""
import json
import math
import re
import subprocess
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
bundle = ROOT / 'site/data/atlas_bundle.json'
if bundle.exists() and json.loads(bundle.read_text()).get('schema_version') == 2:
    raise SystemExit('Legacy export disabled: use scripts/rebuild_core_data.py for schema 2 data.')
data = json.loads((ROOT / 'site/data/site.json').read_text())
invest = json.loads((ROOT / 'site/data/investment_condos.json').read_text())
profile_payload = json.loads((ROOT / 'data/condo_family_profiles.json').read_text())
profiles = {row['name']: row for row in profile_payload['profiles'] if row['status'] == 'observed'}
if 'MONTEREY PARK CONDOMINIUM' in profiles:
    profiles['MONTEREY PARK CONDOMINIUM']['top_year'] = None
    profiles['MONTEREY PARK CONDOMINIUM']['completion_conflict'] = '2005 / 2006'
    profiles['MONTEREY PARK CONDOMINIUM']['completion_year_range'] = [2005, 2006]
    profiles['MONTEREY PARK CONDOMINIUM']['transport_future'] = True
    profiles['MONTEREY PARK CONDOMINIUM']['transport_note'] = 'West Coast MRT is future CRL2, targeted for 2032; excluded from current transport scoring.'
    profiles['MONTEREY PARK CONDOMINIUM']['transport_source_url'] = 'https://www.lta.gov.sg/content/ltagov/en/newsroom/2023/12/news-releases/lta-awards-civil-contract-for-design-and-construction-of-west-co.html'
cache_path = ROOT / 'data/cache/condo_coordinates.json'
cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
exclude = ('NEIGHBOURHOOD PARK', 'EDUCARE', 'DISTRIPARK', 'WOODLANDS ADMIRAL GARDEN', 'FARRER PARK VIEW', 'KIM TIAN TOWERS', 'SENGKANG WEST BRIDGE', 'JURONG WEST PARK', 'ANG MO KIO COURT', 'BISHAN - ANG MO KIO PARK', 'SAINT GEORGE', 'BEDOK SOUTH PARKVIEW', 'SERANGOON GARDEN ESTATE', 'SERANGOON GARDEN PARK', 'BUKIT PANJANG PARK', 'BUKIT PANJANG N2 PARK', 'GOLDBELL TOWERS', 'SCHOOL', 'PUBLIC PARK', 'ROAD PARK', 'COMMUNITY', 'CAR PARK', 'HDB', 'TEMPLE', 'CLINIC', 'INDUSTRIAL', 'BUS STOP', 'PARK CONNECTOR', 'TOWN GARDEN', 'WATERWAY PARK', 'LEARNING', 'MEDICARE', 'HOME FOR', 'COUNTRY CLUB', 'ACTIVE PARK', 'ECO GREEN')
apartment_names = {"AVA TOWERS","BEDOK COURT","BEDOK RESIDENCES","BISHAN LOFT","CITYSCAPE @FARRER PARK","COMMONWEALTH TOWERS","DOVER PARKVIEW","ELIZABETH TOWERS","FARRER PARK SUITES","FERNWOOD TOWERS","GALAXY TOWERS","GEM RESIDENCES","GEYLANG MANSIONS","GOLDHILL TOWERS","HARBOUR VIEW TOWERS","HORIZON TOWERS","HUNDRED PALMS RESIDENCES","INZ RESIDENCE","LAKESIDE TOWER","LEONIE TOWERS","LION TOWERS","MANDALAY TOWERS","MANSIONS 28","NINE RESIDENCES","NORTH PARK RESIDENCES","NOVENA COURT","NOVENA GARDENS","NOVENA SUITES'","OLEANDER TOWERS","PARKWAY APARTMENT","PLATINUM RESIDENCE","PRIME RESIDENCE","RESIDENCE 118","RESIDENCE 66","RESIDENCE 81","RESIDENCE @ ST GEORGE","RESIDENCE TWENTY-TWO","RESIDENCES 88","RESIDENCES @ EVELYN","RESIDENCES @ JANSEN","RESIDENCES @ KILLINEY","RESIDENCES @ NOVENA","RESIDENCES @ SOMME","RESIDENCES AT 338A","RESIDENCES AT EMERALD HILL","RESIDENCES BOTANIQUE","RIVER VALLEY COURT","RIVERDALE RESIDENCE","RIVERSOUND RESIDENCE","SENGKANG GRAND RESIDENCES","SHERWOOD TOWERS","SKYPARK RESIDENCES","SUITES @ TANJONG KATONG","SUITES AT BUKIT TIMAH","SUNFLOWER RESIDENCE","THE GARDEN RESIDENCES","THE LAKEFRONT RESIDENCES","TRELLIS TOWERS","TWIN WATERFALLS","VILLA MARTIA","VILLA PONDER ROSA","VILLAGE TOWER","VILLAS LAGUNA","VUE 8 RESIDENCE","WATERTOWN","WESTWOOD RESIDENCES"}
names = {}
for school in data['primary_schools']:
    for row in school.get('nearby_condos_within_1km', []):
        name = row['name'].upper().strip()
        if ('CONDOMINIUM' in name or name in apartment_names) and not any(token in name for token in exclude) and not re.match(r'^\d+[A-Z]\s', row.get('address', '')):
            names[name] = {'name': name, 'address': row.get('address', '')}
for row in invest['listings']:
    name = row['name'].upper().strip()
    if str(row.get('property_type', '')).lower() in ('condominium', 'apartment', 'executive condominium') and not any(token in name for token in ('VILLAS HOLLAND', 'SAINT GEORGE')):
        names[name] = {'name': name, 'address': row.get('address', ''), 'tenure': row.get('tenure'), 'top_year': row.get('top_year'), 'mrt_station': row.get('mrt_station'), 'source_url': row.get('source_url')}

# Fill geographic gaps in the original 1 km sample; coordinates still require an exact OneMap match.
additional_projects = (
    'PARC CENTROS', 'A TREASURE TROVE', 'PRIVE', 'ECOPOLITAN', 'RIVER ISLES',
    'RIVERPARC RESIDENCE', 'THE TERRACE', 'WATERBAY', 'PIERMONT GRAND',
    'THE FLORAVALE', 'THE MAYFAIR', 'IVORY HEIGHTS', 'J GATEWAY', 'JURONGVILLE',
    'WESTMERE', 'THE JADE', 'THE DEW', 'HILLVIEW REGENCY', 'THE MADEIRA',
    'MI CASA', 'THE WARREN', 'NORTHVALE', 'YEW MEI GREEN', 'YEWTEE RESIDENCES',
    'THE QUARTZ', 'THE CENTRIS', 'WOODHAVEN', 'ROSEWOOD', 'ROSEWOOD SUITES',
    'CASABLANCA', 'NORTHOAKS', 'WOODSVALE', 'LA CASA', 'BELLEWOODS',
    'THE TAMPINES TRILLIANT', 'CITYLIFE@TAMPINES', 'THE ALPS RESIDENCES',
    'THE SANTORINI', 'TREASURE AT TAMPINES', 'TROPICA', 'THE EDEN AT TAMPINES',
    'THE FLORIDA', 'DUNEARN SUITES', 'THE SHELFORD', 'SHELFORD SUITES',
    'ADAM ROAD CONDOMINIUM', 'MAPLE WOODS', 'THE HILLIER', 'HILLION RESIDENCES',
    '8@WOODLEIGH', 'THE POIZ RESIDENCES', 'SANT RITZ', 'EIGHT RIVERSUITES',
    'THOMSON GRAND', 'THE PANORAMA', 'CASTLE GREEN', 'SEASONS PARK',
    'THE CALROSE', 'LENTOR MODERN', 'SELETAR PARK RESIDENCE', 'THOMSON IMPRESSIONS',
    'SKY VUE', 'SKY HABITAT', 'THE BEACON', 'THE CLIFT', 'SPOTTISWOODE RESIDENCES',
    'GARDENVISTA', 'GLENTREES', 'THE NEXUS', 'MONTEREY PARK CONDOMINIUM',
    'PINETREE HILL', 'NAVA GROVE', 'THE TRILINQ', 'THE CLEMENT CANOPY',
)
for name in additional_projects:
    names.setdefault(name, {'name': name, 'address': ''})

def resolve(entry):
    name, row = entry
    if name in cache:
        return name, cache[name]
    try:
        query = urllib.parse.urlencode({'searchVal': name, 'returnGeom': 'Y', 'getAddrDetails': 'Y', 'pageNum': 1})
        time.sleep(1)
        response = subprocess.run(['curl', '--retry', '2', '--retry-delay', '2', '--silent', '--show-error', '--max-time', '20', 'https://www.onemap.gov.sg/api/common/elastic/search?' + query], capture_output=True, text=True, check=True)
        results = json.loads(response.stdout).get('results', [])
        exact = [r for r in results if r.get('BUILDING', '').upper().strip() == name]
        if not exact:
            return name, None
        r = exact[0]
        return name, {'lat': float(r['LATITUDE']), 'lon': float(r['LONGITUDE']), 'address': r['ADDRESS'], 'source': 'OneMap', 'checked_on': '2026-10-06'}
    except Exception as error:
        print(f'Lookup failed: {name}: {error}', flush=True)
        return name, None

for entry in names.items():
    name, coord = resolve(entry)
    if coord:
        cache[name] = coord
cache_path.write_text(json.dumps(cache, indent=2))

def distance(a, b):
    lat1, lat2 = math.radians(a['lat']), math.radians(b['lat'])
    delta = math.radians(b['lon'] - a['lon'])
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(delta/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(h)))

catalog = [{**row, **cache[name], 'family_profile': profiles.get(name)} for name, row in names.items() if name in cache]
nearby = {}
for school in data['primary_schools']:
    if school.get('current_directory_status') == 'not_listed':
        continue
    location = school.get('location')
    if not location:
        nearby[school['slug']] = []
        continue
    rows = []
    for condo in catalog:
        d = distance(location, condo)
        if d <= 2000:
            rows.append({**condo, 'distance_m': round(d)})
    nearby[school['slug']] = sorted(rows, key=lambda row: (row['distance_m'], row['name']))
result = {'as_of_date': '2026-10-06', 'radius_m': 2000, 'distance_method': 'Straight-line distance between OneMap coordinates; verify exact residential block with MOE SchoolFinder.', 'catalog_count': len(catalog), 'family_profile_count': len(profiles), 'unresolved_count': len(names)-len(catalog), 'coverage_note': 'Selected condo catalog, not a complete inventory of all Singapore developments. Family profiles use public portal snapshots; asking prices and facilities are not independently verified.', 'schools': nearby}
(ROOT / 'site/data/school_condos_2km.json').write_text(json.dumps(result, indent=2))
print(json.dumps({'candidates': len(names), 'geocoded': len(catalog), 'schools_with_condos': sum(bool(r) for r in nearby.values())}))
