"""Export only the school fields needed by the two core pages."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
bundle = root / 'site/data/atlas_bundle.json'
if bundle.exists() and json.loads(bundle.read_text()).get('schema_version') == 2:
    raise SystemExit('Legacy export disabled: use scripts/rebuild_core_data.py for schema 2 data.')
source = json.loads((root / 'site/data/site.json').read_text())
keys = ('slug', 'name', 'address', 'website', 'school_info', 'mother_tongue', 'community_ranking', 'directory', 'data_quality', 'location_verification')
schools = []
for row in source['primary_schools']:
    if row.get('current_directory_status') == 'not_listed':
        continue
    school = {key: row.get(key) for key in keys}
    school['ballot_history'] = [{key: record.get(key) for key in ('year', 'vacancy', 'applied', 'source_url', 'verification', 'crosscheck_source_url')} for record in row.get('ballot_history', []) if record['year'] >= 2023]
    snapshots = [row.get('ballot_latest', {}), row.get('ballot_2025', {})]
    school['official_ballot'] = []
    for snapshot in snapshots:
        for phase, result in snapshot.get('phases', {}).items():
            official = result.get('official', {})
            if official.get('source') == 'MOE' and official.get('has_data'):
                school['official_ballot'].append({'year': snapshot.get('year'), 'phase': phase, 'label': official.get('result_label'), 'source_url': official.get('source_url')})
    schools.append(school)
result = {'generated_at': source['generated_at'], 'stats': source['stats'], 'primary_schools': schools, 'verification_report': source.get('verification_report')}
(root / 'site/data/atlas_schools.json').write_text(json.dumps(result, separators=(',', ':')))
print(f'Exported {len(schools)} schools')
