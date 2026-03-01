# Data sources

- `top20_schools.csv` is refreshed from SGSchooling PSLE 2025 community data:
  - https://sgschooling.com/blog/psle-2025-score-ranges-community-data
- `/Users/byc/src/test/site/data/site.json` includes:
  - all SGSchooling primary-school pages (from sitemap)
  - school profile + mother tongue + ballot history
  - PSLE 2025 community ranking table
  - nearby home suggestions (HDB + optional PropertyGuru condos)

## Optional PropertyGuru condo input

Direct automated crawling of PropertyGuru may be blocked by anti-bot protection.
To include PropertyGuru condos in the house page, provide:

- `/Users/byc/src/test/data/propertyguru_condos.csv`

Expected CSV columns:
- `address` (required)
- `price` (required)
- `area_sqm` (optional)
- `date` (optional)
- `url` (optional)
- `project` (optional)

You can generate this CSV with:
- `/Users/byc/src/test/scripts/fetch_propertyguru_condos.py`

## URA condo source (automated)

You can pull condo transactions automatically from URA:

```bash
export URA_ACCESS_KEY="YOUR_URA_KEY"
python3 /Users/byc/src/test/scripts/build_data.py
```

The build output stats will include:
- `ura_condo_count`

## Condo enrichment overrides

You can improve condo-name recall for specific schools by adding OneMap query terms in:
- `/Users/byc/src/test/data/condo_query_overrides.json`

Format:
- key: school slug (same slug used in `site.json`, e.g. `nan-hua`)
- value: list of search queries

See `/Users/byc/src/test/README.md` for full pipeline instructions.
