"""Use retained official records plus clearly separated public secondary evidence."""
import argparse
import datetime as dt
import hashlib
import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo
import requests
from bs4 import BeautifulSoup
from pyproj import Transformer
from import_ura_transactions import normalize_batches, write_output

ROOT=Path(__file__).resolve().parents[1]
BASE='https://www.cashew.sg'
DATE=dt.datetime.now(ZoneInfo('Asia/Singapore')).date().isoformat()
PRIVATE=ROOT/'.private/property-evidence'/DATE
ALIASES={'THETRIZON':'THETRIZONCONDOMINIUM','PANDANVALLEY':'PANDANVALLEYCONDOMINIUM','FAIRLODGE':'FAIRLODGEAPARTMENTS'}

def norm(name):return re.sub('[^A-Z0-9]','',name.upper())

def official(snapshot,retrieved_on):
    output=normalize_batches([snapshot], retrieved_on)
    output['status']='partial'
    output['coverage']={'downloaded_batches':[1],'expected_batches':[1,2,3,4],'national_coverage_complete':False}
    write_output(output,ROOT/'site/data/ura_transactions.json')
    raw=json.loads(snapshot.read_text())
    convert=Transformer.from_crs('EPSG:3414','EPSG:4326',always_xy=True)
    identities={}
    for p in raw['Result']:
        identities.setdefault(norm(p['project']),set()).add((p.get('street'),p.get('x'),p.get('y')))
    points=[]
    for p in raw['Result']:
        # A shared generic name cannot establish a unique project or price match.
        if len(identities[norm(p['project'])])!=1:continue
        valid=[t for t in p.get('transaction',[]) if t.get('propertyType') in ['Condominium','Apartment','Executive Condominium']]
        if not valid:continue
        try:lon,lat=convert.transform(float(p['x']),float(p['y']))
        except (KeyError,ValueError):continue
        if not (1.1<lat<1.5 and 103.5<lon<104.2):continue
        tenures=sorted(set(t.get('tenure') for t in valid if t.get('tenure')))
        points.append({'name':p['project'],'address':p['project']+' '+p['street'],
            'lat':lat,'lon':lon,'source':'URA','coordinate_source_url':output['source_url'],
            'checked_on':output['retrieved_on'],'directory_type':' / '.join(sorted(set(t['propertyType'] for t in valid))),
            'directory_tenure':' / '.join(tenures),'directory_completion':None,
            'directory_source_url':output['source_url'],'family_profile':None,'coordinate_method':'EPSG:3414 to EPSG:4326; project point, not transacted unit'})
    (ROOT/'data/rebuild/ura-projects.json').write_text(json.dumps(points,indent=2))
    print(f"Official batch 1: {len(output['records'])} transactions, {len(points)} non-landed project points",flush=True)


def parse_page(html,url):
    s=BeautifulSoup(html,'html.parser')
    h=s.find('h1')
    if not h:raise ValueError('No project heading')
    project=h.get_text(' ',strip=True)
    rows=[];layouts=[];caption=''
    for table in s.find_all('table'):
        heads=[x.get_text(' ',strip=True) for x in table.select('thead th')]
        if heads==['Date','Price','Area','psf','Floor','Type of sale']:
            caption=table.find('caption').get_text(' ',strip=True) if table.find('caption') else ''
            for tr in table.select('tbody tr'):
                cells=[td.get_text(' ',strip=True) for td in tr.find_all('td')]
                if len(cells)!=6:continue
                month=re.fullmatch(r'([A-Za-z]+) (20\d\d)',cells[0])
                if not month:continue
                months={'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Sept':9,'Oct':10,'Nov':11,'Dec':12}
                m=months.get(month[1])
                if not m:continue
                number=lambda value:float(re.sub(r'[^0-9.]','',value))
                price,area,psf=map(number,cells[1:4])
                if min(price,area,psf)<=0 or abs(price/area-psf)>max(3,psf*.003):raise ValueError('Price/area/PSF conflict')
                rows.append({'project':project,'source':'Cashew','claimed_original_source':'URA',
                    'source_url':url,'checked_on':DATE,'contract_month':f'{month[2]}-{m:02d}',
                    'price_sgd':price,'area_sqft_approx':area,'reported_psf':psf,'floor_range':cells[4],
                    'sale_type':{'Resale':'resale','New Sale':'new_sale','Sub Sale':'sub_sale'}.get(cells[5],'unknown'),
                    'units':None,'coverage':'publicly_displayed_sample_only'})
        if heads==['Unit type','Bedrooms','Area']:
            for tr in table.select('tbody tr'):
                cells=[td.get_text(' ',strip=True) for td in tr.find_all('td')]
                if len(cells)==3 and re.search(r'\d',cells[2]):
                    layouts.append({'type':cells[0],'beds':int(cells[1]) if cells[1].isdigit() else None,'area_sqft':float(re.sub('[^0-9.]','',cells[2]))})
    return {'name':project,'source':'Cashew','source_url':url,'checked_on':DATE,'raw_hash':hashlib.sha256(html.encode()).hexdigest(),'caption':caption,'records':rows,'layouts':layouts,'notice':'Secondary publisher; displayed sample may omit transactions. Not official API records.'}


def fetch(url):
    if urlparse(url).netloc!='www.cashew.sg':raise ValueError('Unexpected source')
    path=PRIVATE/(hashlib.sha256(url.encode()).hexdigest()+'.html')
    if path.exists():return path.read_text()
    time.sleep(1)
    response=requests.get(url,timeout=40)
    response.raise_for_status()
    if urlparse(response.url).netloc!='www.cashew.sg':raise ValueError('Unexpected redirect')
    if 'captcha' in response.text.lower() or 'one moment, please' in response.text.lower():raise RuntimeError('Source challenge: stop collection')
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(response.text)
    return response.text


def collect(limit):
    bundle=json.loads((ROOT/'site/data/atlas_bundle.json').read_text())
    catalog={norm(p['name']):p for rows in bundle['condos']['schools'].values() for p in rows if p.get('source')!='URA'}
    identities={k:k for k in catalog}
    identities.update({alias:key for key,alias in ALIASES.items() if key in catalog})
    # Only follow links published in the directory, never guess per-project URLs.
    initial=fetch(BASE+'/properties');soup=BeautifulSoup(initial,'html.parser')
    districts=[urljoin(BASE,a['href']) for a in soup.find_all('a',href=True) if '/properties/district/' in a['href']]
    urls={}
    for url in list(dict.fromkeys(districts)):
        if url.endswith('/district'):continue
        queue=[url];visited=set()
        while queue:
            page=queue.pop(0)
            if page in visited:continue
            visited.add(page);s=BeautifulSoup(fetch(page),'html.parser')
            for a in s.find_all('a',href=True):
                title=a.select_one('span.font-semibold')
                name=title.get_text(' ',strip=True) if title else a.get_text(' ',strip=True)
                if a['href'].startswith('/property/') and norm(name) in identities:
                    urls[identities[norm(name)]]=urljoin(BASE,a['href'])
                if a.get_text(' ',strip=True)=='Next' and a['href'].startswith(urlparse(url).path):queue.append(urljoin(BASE,a['href']))
        print(f'Directory {len(urls)} matched project links',flush=True)
    destination=ROOT/'site/data/property_evidence.json'
    existing=json.loads(destination.read_text()) if destination.exists() else {'projects':{}}
    projects=existing['projects'];errors=[]
    priority=[norm(p['name']) for p in bundle['condos']['schools'].get('henry-park',[])]
    selected=sorted(urls,key=lambda k:(k not in priority,priority.index(k) if k in priority else 999,k))[:limit]
    for i,key in enumerate(selected):
        try:
            evidence=parse_page(fetch(urls[key]),urls[key])
            if identities.get(norm(evidence['name']))!=key:raise ValueError('Project identity mismatch')
            evidence['catalog_name']=catalog[key]['name']
            projects[key]=evidence
        except (ValueError,requests.RequestException) as exc:errors.append({'url':urls[key],'error':type(exc).__name__})
        output={'schema_version':1,'checked_on':DATE,'source':'Cashew','projects':projects,'errors':errors,'coverage':'displayed_samples_only'}
        write_output(output,destination)
        print(f'Project {i+1}/{len(selected)}: {len(projects)} saved',flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--official-snapshot',type=Path);p.add_argument('--retrieved-on');p.add_argument('--public',action='store_true');p.add_argument('--limit',type=int,default=100);args=p.parse_args()
    if args.official_snapshot:
        if not args.retrieved_on:p.error('--official-snapshot requires the actual --retrieved-on date')
        official(args.official_snapshot,args.retrieved_on)
    if args.public:collect(args.limit)
