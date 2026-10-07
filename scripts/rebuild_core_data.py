"""Rebuild core data from raw source snapshots, never from legacy site datasets."""
import argparse
import hashlib
import json
import math
import re
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/rebuild/raw'
OUT = ROOT / 'data/rebuild'
DATE = '2026-10-06'
DIRECTORY = 'https://data.gov.sg/datasets/d_688b934f82c1059ed0a6993d2a829089/view'
P1 = 'https://primarysch.com/schools_data.json'
MOE = 'https://www.moe.gov.sg/primary/p1-registration/past-vacancies-and-balloting-data'
PROPERTY_DIRECTORY = 'https://homy.sg/condo-directory/'
PHASES = ('2B', '2C', '2C(S)')

def norm(value):
    text = re.sub(r'\(PRIMARY(?: SECTION)?\)', '', value.upper()).replace('SAINT', 'ST')
    return re.sub('[^A-Z0-9]', '', text).replace('SCHOOLJUNIOR', 'JUNIORSCHOOL')

def slug(value):
    value = re.sub(r'\(PRIMARY SECTION\)|PRIMARY SCHOOL|PRIMARY|SCHOOL', '', value.upper())
    return re.sub('[^a-z0-9]+', '-', value.lower()).strip('-')

def count(value):
    if isinstance(value, bool): return None
    text = str(value).replace(',', '').strip()
    return int(text) if text.isdigit() else None

def clean(value):
    return '' if str(value).lower().strip() in ('na','n/a','none','-') else str(value).strip()

def embedded_array(html, key):
    marker = '\\"' + key + '\\":'
    start = html.find(marker)
    if start < 0: raise ValueError('MOE schoolData absent: no fallback to old data')
    start = html.index('[', start)
    # Decode one JSON string escape layer, then use the JSON parser for bracket/string handling.
    tail = html[start:]
    decoded = bytes(tail, 'utf8').decode('unicode_escape')
    return json.JSONDecoder().raw_decode(decoded)[0]

def fetch_coord(job):
    key, postal, expected = job
    query = urlencode({'searchVal':postal or expected,'returnGeom':'Y','getAddrDetails':'Y','pageNum':1})
    time.sleep(2)
    response = subprocess.run(['curl','--fail','--silent','--show-error','--max-time','15','https://www.onemap.gov.sg/api/common/elastic/search?'+query],capture_output=True,text=True)
    if '429' in response.stderr:
        raise RuntimeError('OneMap rate limit: stop collection; do not record a missing coordinate')
    try:
        payload=json.loads(response.stdout)
        response_dir=OUT/'location-responses'
        response_dir.mkdir(exist_ok=True)
        (response_dir/(key.replace(':','-')+'.json')).write_text(json.dumps(payload,indent=2))
        if payload.get('error'):
            raise RuntimeError('OneMap source reports an error; stop and resolve API authorization before collecting more locations')
        rows = payload.get('results',[])
        rows = [r for r in rows if (not postal or r.get('POSTAL') == postal) and norm(r.get('BUILDING','')) == norm(expected)]
        if not rows and postal:
            # School names may include a campus suffix; postcode alone is never enough for projects.
            rows = [r for r in json.loads(response.stdout).get('results',[]) if r.get('POSTAL') == postal and norm(expected) in norm(r.get('BUILDING',''))]
        if rows:
            row = rows[0]
            return key, {'lat':float(row['LATITUDE']),'lon':float(row['LONGITUDE']),'postal_code':row['POSTAL'],'building':row['BUILDING'],'address':row['ADDRESS'],'source':'OneMap','checked_on':DATE}
    except (ValueError, KeyError): pass
    return key, None

def distance(a,b):
    lat1,lat2=math.radians(a['lat']),math.radians(b['lat'])
    h=math.sin((lat2-lat1)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(math.radians(b['lon']-a['lon'])/2)**2
    return 6371000*2*math.asin(min(1,math.sqrt(h)))

def build(online=False, limit=None, schools_only=False):
    directory=json.loads((RAW/'moe-directory.json').read_text())['result']['records']
    p1=json.loads((RAW/'p1-counts.json').read_text())
    p1index={norm(r['officialName']):r for r in p1['schools']}
    current_schools=embedded_array((RAW/'moe-primary-map.html').read_text(),'schools')
    current_index={norm(r['school_name']):r for r in current_schools}
    assert len(current_index)==182
    cross=json.loads((RAW/'p1-crosscheck.json').read_text())
    crossindex={norm(r['name']):r for r in cross['schools']}
    numeric_checks=0
    numeric_conflicts=[]
    moe=embedded_array((RAW/'moe-balloting.html').read_text(),'schoolData')
    official={}
    for school in moe:
        name=school.get('school',{}).get('school_name')
        if not name: continue
        for r in school.get('phase_items',[]):
            item=r.get('school_phase_item_id',{})
            phase=item.get('phase','').replace('2CS','2C(S)').replace('2C Supplementary','2C(S)')
            if phase not in PHASES:continue
            year=count(item.get('year'))
            if not year:continue
            text=BeautifulSoup(item.get('balloting_content_copy') or '', 'html.parser').get_text(' ',strip=True)
            remarks=BeautifulSoup(item.get('remarks') or '', 'html.parser').get_text(' ',strip=True)
            official.setdefault(norm(name),{}).setdefault(year,{})[phase]={'year':year,'phase':phase,'source':'MOE','source_url':MOE,'result_text':text,'remarks':remarks,'balloting_required':item.get('balloting_required'),'vacancy':count(item.get('total_vacancies')),'applied':count(item.get('total_applicants')),'vacancies_balloted':count(item.get('vacancies_balloted')),'applicants_balloted':count(item.get('applicants_balloted')),'checked_on':DATE}
    schools=[]
    for record in directory:
        key=norm(record['school_name'])
        secondary=p1index.get(key)
        current=current_index.get(key)
        if not current:continue
        name=current['school_name']
        short=secondary['shortName'] if secondary else record['school_name']
        identifier=slug(short)
        # Stable human-readable names are derived from source short names, not legacy slug mappings.
        if identifier=='pei-hwa-presbyterian':identifier='pei-hwa'
        postal=str(current['school_address_postal_code']).zfill(6)
        town=clean(record['dgp_code']).title().replace('Seng Kang','Sengkang')
        addr=' '.join(filter(None,[clean(current.get('school_address_blk_no')),clean(current.get('school_address'))]))+' S'+postal
        histories=[]
        for year in sorted(set(map(int,secondary.get('years',{}))) | set(official.get(key,{})),reverse=True) if secondary else sorted(official.get(key,{}),reverse=True):
            if year<2023:continue
            phases=secondary.get('years',{}).get(str(year),{}) if secondary else {}
            history={'year':year,'vacancy':{},'applied':{},'source_url':P1,'verification':'secondary_compilation','balloting':{},'checked_on':DATE}
            for phase in PHASES:
                numeric=phases.get('2CS' if phase=='2C(S)' else phase,{})
                result=official.get(key,{}).get(year,{}).get(phase)
                history['balloting'][phase]=result
                for metric in ('vacancy','applied'):
                    history[metric][phase]=result[metric] if result else count(numeric.get(metric))
                    other=crossindex.get(key,{}).get('phases',{}).get(phase)
                    if year==2026 and other:
                        numeric_checks+=1
                        if history[metric][phase]!=other[metric]:
                            numeric_conflicts.append({'school':name,'phase':phase,'metric':metric,'first':history[metric][phase],'second':other[metric]})
                            history[metric][phase]=None
            if official.get(key,{}).get(year):history.update(source_url=MOE,verification='direct_moe')
            elif year==2026 and key in crossindex:history.update(verification='crosschecked_secondary_sources',crosscheck_source_url=cross['source_url'])
            histories.append(history)
        fallback=None
        if secondary and str(secondary.get('postalCode')).zfill(6)==postal:
            try:
                lat,lon=float(secondary['latitude']),float(secondary['longitude'])
                if 1.2<lat<1.5 and 103.6<lon<104.1:
                    fallback={'lat':lat,'lon':lon,'postal_code':postal,'source':'PrimarySch (secondary coordinates, not independently geocoded)','source_url':P1,'checked_on':DATE,'status':'secondary_postal_matched'}
            except (ValueError,KeyError,TypeError):pass
        schools.append({'slug':identifier,'name':name,'website':clean(current.get('school_website_url')),'address':{'street':addr,'locality':town,'country':'SG'},'school_info':{'Town':town,'Address':addr,'Type':', '.join(filter(None,[clean(record['type_code']),clean(record['nature_code']),'SAP' if current.get('sap_school')=='Y' else '']))},'mother_tongue':{'Regular':{clean(record[k]).title():True for k in ('mothertongue1_code','mothertongue2_code','mothertongue3_code') if clean(record[k])}},'directory':{'postal_code':postal,'telephone':clean(current.get('school_telephone_no') or current.get('school_telephone_number')),'source_url':'https://www.moe.gov.sg/schoolfinder/Primary%20school','updated_at':current.get('date_updated'),'checked_on':DATE},'data_quality':{'has_2026':any(r['year']==2026 for r in histories),'checked_on':DATE},'ballot_history':histories,'coordinate_fallback':fallback,'official_ballot':[result for phases in official.get(key,{}).values() for result in phases.values()]})
    assert len(schools)==182 and len(set(s['slug'] for s in schools))==len(schools)
    assert not numeric_conflicts, f'Conflicting numeric evidence: {numeric_conflicts}'
    soup=BeautifulSoup((RAW/'condo-directory.html').read_text(),'html.parser')
    projects={}
    for card in soup.select('a.homy-directory-card'):
        if card.get('data-type') not in ('condo','ec'):continue
        name=card.select_one('.homy-directory-card-name').get_text(strip=True)
        addr=card.select_one('.homy-directory-card-address').get_text(strip=True)
        postal=re.search(r'S(\d{6})\b',addr)
        meta=[s.get_text(strip=True) for s in card.select('.homy-directory-card-meta span')]
        projects.setdefault(norm(name),{'name':name,'address':addr,'directory_type':card.get('data-type'),'directory_source_url':card['href'],'directory_checked_on':DATE,'directory_tenure':meta[2] if len(meta)>2 else None,'directory_completion':next((int(m[4:]) for m in meta if re.fullmatch(r'TOP \d{4}',m)),None),'postal_code':postal[1] if postal else None,'family_profile':None})
    assert len(projects)>2000
    coordinates_path=OUT/'coordinates.json'
    coordinates=json.loads(coordinates_path.read_text()) if coordinates_path.exists() else {}
    jobs=[('school:'+s['slug'],s['directory']['postal_code'],s['name']) for s in schools]+[('project:'+k,p['postal_code'],p['name']) for k,p in projects.items()]
    pending=[j for j in jobs if not coordinates.get(j[0])]
    if schools_only:pending=[j for j in pending if j[0].startswith('school:')]
    priority=['ANGLO-CHINESE SCHOOL (JUNIOR)',"ST. ANDREW'S JUNIOR SCHOOL",'HENRY PARK PRIMARY SCHOOL','GLENTREES','PARKSUITES','QUINTERRA','PANDAN VALLEY','THE SIERRA','EVIAN CONDOMINIUM','THE TRIZON','RIDGEWOOD CONDOMINIUM','DOVER PARKVIEW','FONTANA HEIGHTS','PINE GROVE','CAVENDISH PARK','ASTOR GREEN','ALLSWORTH PARK','MOUNT SINAI RESIDENCES','VILLAGE TOWER']
    priority_keys=[norm(n) for n in priority]
    pending.sort(key=lambda j:(priority_keys.index(norm(j[2])) if norm(j[2]) in priority_keys else len(priority_keys)+(0 if j[1] and j[1][:2] in ('27','59') else 1),j[0]))
    if limit:pending=pending[:limit]
    if online:
        with ThreadPoolExecutor(max_workers=1) as pool:
            for n,(key,value) in enumerate(pool.map(fetch_coord,pending),1):
                coordinates[key]=value
                if n%25==0:
                    coordinates_path.write_text(json.dumps(coordinates,indent=2))
                    print(f'Fresh OneMap lookups {n}/{len(pending)}, matched {sum(v is not None for v in coordinates.values())}',flush=True)
        coordinates_path.write_text(json.dumps(coordinates,indent=2))
    for s in schools:
        coord=coordinates.get('school:'+s['slug']) or s.pop('coordinate_fallback')
        s.pop('coordinate_fallback',None)
        s['location']= {'lat':coord['lat'],'lon':coord['lon']} if coord else None
        s['location_verification']=coord
    catalog=[]
    exclusions=json.loads((OUT/'property-exclusions.json').read_text())
    for key,p in projects.items():
        coord=coordinates.get('project:'+key)
        if coord and p['name'] not in exclusions:catalog.append({**p,**coord})
    ura_path=OUT/'ura-projects.json'
    ura_conflicts=[]
    if ura_path.exists():
        located={norm(p['name']):p for p in catalog}
        for p in json.loads(ura_path.read_text()):
            key=norm(p['name'])
            if p['name'] in exclusions:continue
            previous=located.get(key)
            if previous and distance(previous,p)>500:
                ura_conflicts.append({'name':p['name'],'distance_difference_m':round(distance(previous,p))})
                continue
            # Preserve secondary completion evidence; official project coordinates win only after consistency checks.
            existing=projects.get(key,{})
            located[key]={**existing,**p,'directory_completion':existing.get('directory_completion')}
            projects.setdefault(key,p)
        catalog=list(located.values())
    nearby={s['slug']:sorted([{**p,'distance_m':round(distance(s['location'],p))} for p in catalog if s['location'] and distance(s['location'],p)<=2000],key=lambda r:(r['distance_m'],r['name'])) for s in schools}
    report={'checked_on':DATE,'school_count':len(schools),'school_coordinates_available':sum(s['location'] is not None for s in schools),'school_coordinates_verified':sum(s['location_verification'] is not None and s['location_verification']['source']=='OneMap' for s in schools),'p1_latest_year':max(r['year'] for s in schools for r in s['ballot_history']),'moe_ballot_years':sorted(set(y for r in official.values() for y in r)),'numeric_cells_checked':numeric_checks,'numeric_conflicts':numeric_conflicts,'property_directory_count':len(projects),'property_coordinates_verified':len(catalog),'unresolved_properties':len(projects)-len(catalog),'source_hashes':{path.name:hashlib.sha256(path.read_bytes()).hexdigest() for path in RAW.iterdir() if path.is_file()},'notice':'Rebuilt independently of all legacy site/cache JSON. Project directory is secondary, not authoritative; coordinates confirm geographic matches only. No old listing samples are reused.'}
    OUT.mkdir(exist_ok=True)
    (OUT/'schools.json').write_text(json.dumps(schools,indent=2,ensure_ascii=False))
    (OUT/'projects.json').write_text(json.dumps(list(projects.values()),indent=2))
    (OUT/'audit.json').write_text(json.dumps(report,indent=2))
    report['excluded_project_conflicts']=exclusions
    report['ura_coordinate_conflicts']=ura_conflicts
    report['ura_project_points_used']=sum(p.get('source')=='URA' for p in catalog)
    report['school_coordinates_matched']=report.pop('school_coordinates_verified')
    report['property_coordinates_matched']=report.pop('property_coordinates_verified')
    probe=RAW/'onemap-condominium-page1.json'
    report['source_access_warning']=json.loads(probe.read_text()).get('error') if probe.exists() else None
    report['completion_status']='partial: project inventory geocoding, classification and individual sale evidence incomplete'
    (OUT/'audit.json').write_text(json.dumps(report,indent=2))
    if report['school_coordinates_available']>=175 and len(catalog)>=10:
        atlas={'schema_version':2,'generated_at':datetime.now(timezone.utc).isoformat(),'stats':{'latest_ballot_year':report['p1_latest_year']},'primary_schools':schools,'verification_report':report}
        condos={'schema_version':2,'as_of_date':DATE,'catalog_count':len(catalog),'family_profile_count':0,'schools':nearby,'verification_report':report}
        (ROOT/'site/data/atlas_schools.json').write_text(json.dumps(atlas,ensure_ascii=False,separators=(',',':')))
        (ROOT/'site/data/school_condos_2km.json').write_text(json.dumps(condos,separators=(',',':')))
        # One atomically replaced bundle prevents schools and distances from different builds mixing.
        staging=ROOT/'site/data/atlas_bundle.json.tmp'
        staging.write_text(json.dumps({**atlas,'condos':condos},ensure_ascii=False,separators=(',',':')))
        staging.replace(ROOT/'site/data/atlas_bundle.json')
    print(json.dumps(report,indent=2),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--online',action='store_true');parser.add_argument('--limit',type=int);parser.add_argument('--schools-only',action='store_true');args=parser.parse_args();build(args.online,args.limit,args.schools_only)
