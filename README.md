# SGSchooling Primary Schools Mirror

Static site generator that mirrors SGSchooling primary-school data into a local website.
It collects:
- All `/school/*.html` primary-school pages from SGSchooling sitemap
- School profile fields (town, address, type, affiliation, CCA, etc.)
- Mother-tongue offerings
- Ballot history table
- PSLE 2025 community ranking table

## Data source

- SGSchooling sitemap:
  - https://sgschooling.com/sitemap.xml
- SGSchooling primary-school pages:
  - https://sgschooling.com/school/
- SGSchooling PSLE 2025 community ranking:
  - https://sgschooling.com/blog/psle-2025-score-ranges-community-data

The build step also refreshes:
- `/Users/byc/src/test/data/top20_schools.csv`
- `/Users/byc/src/test/site/data/site.json`

## Build data

Install Python dependencies:

```bash
python3 -m pip install -r /Users/byc/src/test/scripts/requirements.txt
```

Run the data build:

```bash
python3 /Users/byc/src/test/scripts/build_data.py
```

This generates:

- `/Users/byc/src/test/site/data/site.json`
- `/Users/byc/src/test/data/top20_schools.csv`

## Serve the site

```bash
cd /Users/byc/src/test/site
python3 -m http.server 8000
```

Open http://localhost:8000

## Notes

- Data is community-contributed and may be incomplete/inaccurate.
- If SGSchooling changes HTML structures, update `/Users/byc/src/test/scripts/build_data.py` selectors/parsers.
