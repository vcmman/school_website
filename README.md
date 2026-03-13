# SGSchooling Primary Schools Mirror

Static site generator that mirrors SGSchooling primary-school data into a local website.
It collects:
- All `/school/*.html` primary-school pages from SGSchooling sitemap
- School profile fields (town, address, type, affiliation, CCA, etc.)
- Mother-tongue offerings
- Ballot history table
- PSLE 2025 community ranking table
- Nearby home suggestions within 1km (HDB by default, optional PropertyGuru condos via CSV input)
- Nearby condo names within 1km from OneMap place search (no sales data required)

## Data source

- SGSchooling sitemap:
  - https://sgschooling.com/sitemap.xml
- SGSchooling primary-school pages:
  - https://sgschooling.com/school/
- SGSchooling PSLE 2025 community ranking:
  - https://sgschooling.com/blog/psle-2025-score-ranges-community-data

The build step also refreshes:
- `/Users/byc/src/webschool/data/top20_schools.csv`
- `/Users/byc/src/webschool/site/data/site.json`

## Build data

Install Python dependencies:

```bash
python3 -m pip install -r /Users/byc/src/webschool/scripts/requirements.txt
```

Run the data build:

```bash
python3 /Users/byc/src/webschool/scripts/build_data.py
```

Optional: export PropertyGuru condo rows (manual browser-assisted), then rebuild:

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
python3 /Users/byc/src/webschool/scripts/fetch_propertyguru_condos.py
python3 /Users/byc/src/webschool/scripts/build_data.py
```

Preferred automated condo source (URA API):

```bash
export URA_ACCESS_KEY="YOUR_URA_KEY"
python3 /Users/byc/src/webschool/scripts/build_data.py
```

This generates:

- `/Users/byc/src/webschool/site/data/site.json`
- `/Users/byc/src/webschool/data/top20_schools.csv`

## Serve the site

```bash
cd /Users/byc/src/webschool/site
python3 -m http.server 8000
```

Open http://localhost:8000

## Notes

- Data is community-contributed and may be incomplete/inaccurate.
- If SGSchooling changes HTML structures, update `/Users/byc/src/webschool/scripts/build_data.py` selectors/parsers.
- PropertyGuru may block bot requests. If direct fetch is blocked, place condo listings in
  `/Users/byc/src/webschool/data/propertyguru_condos.csv` (see `/Users/byc/src/webschool/data/README.md`).
- URA condo pull requires `URA_ACCESS_KEY`. Without it, URA condo count remains 0 and the build continues.
