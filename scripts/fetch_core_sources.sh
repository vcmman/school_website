#!/bin/sh
# Stage downloads separately; failed/blocked responses must not replace accepted snapshots.
set -eu
cd "$(dirname "$0")/.."
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
fetch() { curl --fail --location --silent --show-error --max-time 60 "$2" > "$stage/$1"; }
fetch moe-directory.json 'https://data.gov.sg/api/action/datastore_search?resource_id=d_688b934f82c1059ed0a6993d2a829089&limit=1000'
fetch p1-counts.json 'https://primarysch.com/schools_data.json'
fetch moe-primary-map.html 'https://www.moe.gov.sg/schoolfinder/Primary%20school'
fetch moe-balloting.html 'https://www.moe.gov.sg/primary/p1-registration/past-vacancies-and-balloting-data'
fetch moe-current.html 'https://www.moe.gov.sg/primary/p1-registration/vacancies-and-balloting'
fetch condo-directory.html 'https://homy.sg/condo-directory/'
python3 - "$stage" <<'PY'
import json,sys
from pathlib import Path
p=Path(sys.argv[1])
assert len(json.loads((p/'moe-directory.json').read_text())['result']['records'])>=300
assert len(json.loads((p/'p1-counts.json').read_text())['schools'])>=175
for name,marker in [('moe-primary-map.html','school_address_postal_code'),('moe-balloting.html','schoolData'),('condo-directory.html','homy-directory-card')]:
 assert marker in (p/name).read_text(), f'{name}: blocked or schema changed'
PY
mkdir -p data/rebuild/raw
cp "$stage"/* data/rebuild/raw/
printf 'Source snapshots fetched; retrieve independent 2026 numeric cross-check separately before building.\n'
