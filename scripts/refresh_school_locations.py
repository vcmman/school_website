"""Verify school coordinates against the current official postal address."""
import json
import subprocess
import time
import urllib.parse
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'site/data/site.json'
data = json.loads(path.read_text())
cache_path = ROOT / 'data/cache/school_coordinates_2026.json'
cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
matched = 0
for school in data['primary_schools']:
    if school.get('current_directory_status') != 'listed':
        continue
    postal = school['directory']['postal_code']
    if postal not in cache:
        time.sleep(1)
        query = urllib.parse.urlencode({'searchVal': postal, 'returnGeom': 'Y', 'getAddrDetails': 'Y', 'pageNum': 1})
        response = subprocess.run(['curl','--silent','--show-error','--retry','2','--retry-delay','2','--max-time','20','https://www.onemap.gov.sg/api/common/elastic/search?' + query],capture_output=True,text=True)
        try:
            rows = json.loads(response.stdout).get('results', [])
            rows = [row for row in rows if row.get('POSTAL') == postal]
            if rows:
                row = rows[0]
                cache[postal] = {'lat':float(row['LATITUDE']), 'lon':float(row['LONGITUDE']), 'postal_code':postal, 'building':row['BUILDING'], 'source':'OneMap', 'checked_on':'2026-10-06'}
                cache_path.write_text(json.dumps(cache, indent=2))
        except (ValueError, KeyError):
            pass
    coord = cache.get(postal)
    if coord:
        school['location'] = {'lat':coord['lat'], 'lon':coord['lon']}
        school['location_verification'] = coord
        matched += 1
    else:
        school['location'] = None
        school['location_verification'] = {'status':'unverified_current_address','postal_code':postal}
    if matched and matched % 30 == 0:
        print(f'Coordinates verified: {matched}', flush=True)
assert matched >= 170, 'Insufficient coordinate coverage; retain original dataset'
data['stats']['schools_with_verified_location'] = matched
path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
print(f'Verified {matched} current school locations')
