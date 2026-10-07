# Data sources

## Repository Storage

`data/cache/` contains local download/geocoding caches and is ignored by Git. `data/rebuild/` keeps source downloads and generated intermediates locally; only its README and manual property exclusion list are tracked. Website bundles in `site/data/` are deployment inputs, not disposable caches, and remain tracked except for the separately provisioned transaction/sample files. See `data/rebuild/README.md` for the current pipeline. The legacy sources below do not drive the rebuilt core pages.

- `top20_schools.csv` is refreshed from SGSchooling PSLE 2025 community data:
  - https://sgschooling.com/blog/psle-2025-score-ranges-community-data
- `/Users/byc/src/webschool/site/data/site.json` includes:
  - all SGSchooling primary-school pages (from sitemap)
  - school profile + mother tongue + ballot history
  - PSLE 2025 community ranking table
  - nearby home suggestions (HDB + optional PropertyGuru condos)

## Optional PropertyGuru condo input

Direct automated crawling of PropertyGuru may be blocked by anti-bot protection.
To include PropertyGuru condos in the house page, provide:

- `/Users/byc/src/webschool/data/propertyguru_condos.csv`

Expected CSV columns:
- `address` (required)
- `price` (required)
- `area_sqm` (optional)
- `date` (optional)
- `url` (optional)
- `project` (optional)

You can generate this CSV with:
- `/Users/byc/src/webschool/scripts/fetch_propertyguru_condos.py`

## URA condo source (automated)

You can pull condo transactions automatically from URA:

```bash
export URA_ACCESS_KEY="YOUR_URA_KEY"
python3 /Users/byc/src/webschool/scripts/build_data.py
```

The build output stats will include:
- `ura_condo_count`

## Condo enrichment overrides

You can improve condo-name recall for specific schools by adding OneMap query terms in:
- `/Users/byc/src/webschool/data/condo_query_overrides.json`

Format:
- key: school slug (same slug used in `site.json`, e.g. `nan-hua`)
- value: list of search queries

See `/Users/byc/src/webschool/README.md` for full pipeline instructions.
