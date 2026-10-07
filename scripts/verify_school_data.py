"""Reconcile schools against the official directory and audit P1 numeric sources."""
import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data/cache'
SITE = ROOT / 'site/data/site.json'
CHECKED_ON = '2026-10-06'
DIRECTORY_URL = 'https://data.gov.sg/datasets/d_688b934f82c1059ed0a6993d2a829089/view'
P1_URL = 'https://primarysch.com/schools_data.json'

def normalize(name):
    name = re.sub(r'\(PRIMARY SECTION\)', '', name.upper())
    return re.sub('[^A-Z0-9]', '', name).replace('SAINT', 'ST').replace('SCHOOLJUNIOR', 'JUNIORSCHOOL')

def integer(value):
    return value if isinstance(value, int) and not isinstance(value, bool) and value >= 0 else None

def clean(value):
    value = str(value or '').strip()
    return '' if value.lower() in ('na', 'n/a', '-') else value

source = json.loads(SITE.read_text())
records = json.loads((CACHE / 'school_directory_2026.json').read_text())['result']['records']
p1 = json.loads((CACHE / 'primarysch_schools_data.json').read_text())
cross = json.loads((CACHE / 'p1_crosscheck_2026.json').read_text())
assert len(records) >= 300 and len(p1['schools']) >= 175 and len(cross['schools']) == 179
index = {normalize(row['school_name']): row for row in records}
p1index = {normalize(row['officialName']): row for row in p1['schools']}
crossindex = {normalize(row['name']): row for row in cross['schools']}
report = {'checked_on': CHECKED_ON, 'directory_published_on': '2026-04-17', 'p1_published_on': p1['metadata']['generated'], 'sources': [DIRECTORY_URL, P1_URL, cross['source_url']], 'excluded_from_current_directory': [], 'missing_2026': [], 'conflicts': [], 'numeric_cells_checked': 0, 'address_conflicts': [], 'directory_matched': 0}

for school in source['primary_schools']:
    key = normalize(school['name'])
    record = index.get(key)
    if record is None:
        school['current_directory_status'] = 'not_listed'
        report['excluded_from_current_directory'].append(school['name'])
        continue
    school['current_directory_status'] = 'listed'
    report['directory_matched'] += 1
    town = clean(record['dgp_code']).title().replace('Seng Kang', 'Sengkang')
    postal = str(record['postal_code']).zfill(6)
    street = clean(record['address'])
    school['address'] = {'street': street + ' S' + postal, 'locality': town, 'country': 'SG'}
    school['website'] = clean(record['url_address'])
    school['directory'] = { 'official_name': record['school_name'], 'website': school['website'], 'address': street, 'postal_code': postal, 'town': town, 'zone': clean(record['zone_code']), 'type': clean(record['type_code']), 'gender': clean(record['nature_code']), 'session': clean(record['session_code']), 'level': clean(record['mainlevel_code']), 'telephone': clean(record['telephone_no']), 'email': clean(record['email_address']), 'mrt': clean(record['mrt_desc']), 'principal': clean(record['principal_name']), 'source_url': DIRECTORY_URL, 'checked_on': CHECKED_ON, 'published_on': '2026-04-17' }
    info = school.setdefault('school_info', {})
    info['Town'], info['Address'], info['Website'] = town, school['address']['street'], school['website']
    info['Type'] = ', '.join(filter(None, [school['directory']['type'], school['directory']['gender'], 'SAP' if record['sap_ind'] == 'Yes' else '']))
    regular = {language.title(): True for field in ('mothertongue1_code', 'mothertongue2_code', 'mothertongue3_code') if (language := clean(record[field]))}
    school.setdefault('mother_tongue', {})['Regular'] = regular
    latest = p1index.get(key)
    checked = crossindex.get(key)
    histories = {row['year']: row for row in school.get('ballot_history', [])}
    if latest:
        if str(latest['postalCode']).zfill(6) != postal:
            report['address_conflicts'].append({'school': school['name'], 'directory_postal': postal, 'p1_postal': latest['postalCode']})
        for year, phases in latest['years'].items():
            row = histories.setdefault(int(year), {'year': int(year), 'vacancy': {}, 'applied': {}})
            row['numeric_source'] = 'PrimarySch (secondary compilation)'
            row['source_url'], row['checked_on'] = P1_URL, CHECKED_ON
            row['verification'] = 'single_source'
            for name, values in phases.items():
                phase = '2C(S)' if name == '2CS' else name
                for metric in ('vacancy', 'applied'):
                    row.setdefault(metric, {})[phase] = integer(values.get(metric))
                other = checked.get('phases', {}).get(phase) if checked and int(year) == 2026 else None
                if other:
                    for metric in ('vacancy', 'applied'):
                        report['numeric_cells_checked'] += 1
                        if row[metric][phase] != other[metric]:
                            report['conflicts'].append({'school': school['name'], 'phase': phase, 'metric': metric, 'primarysch': row[metric][phase], 'crosscheck': other[metric]})
                            row[metric][phase] = None
            if int(year) == 2026 and checked:
                row['verification'] = 'crosschecked_secondary_sources'
                row['crosscheck_source_url'] = cross['source_url']
    if 2026 not in histories:
        report['missing_2026'].append(school['name'])
    school['ballot_history'] = sorted(histories.values(), key=lambda row: -row['year'])
    school['data_quality'] = {'checked_on': CHECKED_ON, 'directory_source_url': DIRECTORY_URL, 'ballot_source_url': P1_URL, 'ballot_published_on': p1['metadata']['generated'], 'has_2026': 2026 in histories, 'crosschecked_2026': bool(checked), 'historical_ballot_note': '2023-2025 figures come from one secondary compilation; not directly verified against MOE.'}

assert report['directory_matched'] == 182
assert not report['conflicts'], 'Conflicting 2026 counts: resolve before publishing'
source['generated_at'] = datetime.now(timezone.utc).isoformat()
source['sources']['school_directory'] = DIRECTORY_URL
source['stats']['current_directory_school_count'] = report['directory_matched']
source['stats']['school_data_checked_on'] = CHECKED_ON
source['stats']['ballot_2026_crosschecked_count'] = sum(s.get('data_quality', {}).get('crosschecked_2026', False) for s in source['primary_schools'])
source['verification_report'] = report
SITE.write_text(json.dumps(source, indent=2, ensure_ascii=False))
(ROOT / 'site/data/school_data_audit.json').write_text(json.dumps(report, indent=2))
with (CACHE / 'school_directory.csv').open('w') as handle:
    writer = csv.DictWriter(handle, fieldnames=[k for k in records[0] if k != '_id'], lineterminator='\n')
    writer.writeheader()
    writer.writerows([{k: v for k, v in row.items() if k != '_id'} for row in records])
print(json.dumps(report, indent=2))
