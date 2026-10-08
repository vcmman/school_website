# Independent Core Data Rebuild

This pipeline replaces data used by School Explorer and Condo Picks. It does not read `site/data/site.json`, `investment_condos.json`, legacy condo CSVs, `data/cache/*`, or prior parsed family profiles. Older research artifacts are not a source for current decisions and have not been rebuilt.

## Evidence

- Current school names, addresses, contacts and websites: raw MOE SchoolFinder primary list (182 records; records updated 2026-10-05). MOE/data.gov.sg directory supplies school type, town and language fields; the older directory does not override the current SchoolFinder address.
- 2025 applicants, vacancies and citizenship/distance outcomes: directly parsed MOE `schoolData`, including the complete original `balloting_content_copy`, the phase and year. Restricted admission without balloting and PR-cap balloting are separate cases. No 2026 citizenship/distance outcomes are inferred.
- 2023, 2024 and 2026 counts: newly downloaded PrimarySch secondary compilation. The 2026 numerical fields are compared with a newly retrieved SGSchoolKaki grid; phase 1/3 derived estimates and secondary citizenship claims are not used.
- Project discovery: freshly downloaded public Homy directory (secondary source), condo/EC cards only, deduplicated by normalized name. Type/tenure/completion are unverified source claims, not official registry facts. Directory may include demolished, future or misclassified developments.
- Locations: independent new OneMap lookups against each current school/project postal address and building name, in `coordinates.json`. A postal code alone does not establish a project match. School secondary-coordinate fallbacks require the current official postal code to agree and are labelled. Distances are school-point to a single matching project block, not school boundary-to-residential block official admission distance.
- Old sale listing samples are discarded. No project receives a value/condition score from an unverified sample. Matching recommendations require individual sale-page evidence and verified completed-project evidence; current stock is not yet acquired. Empty recommendations are intentional, not a claim that the market has no suitable properties.

Raw downloads and content hashes in `audit.json` make the rebuild traceable. The main pages expose missing records and partial project coverage. The 2026-10-06 label is the snapshot retrieval date, not a guarantee that all underlying facts were updated on that day.

## Refresh

```
sh scripts/fetch_core_sources.sh
# Separately retrieve the SGSchoolKaki grid into raw/p1-crosscheck.json and retain the source text.
python3 scripts/rebuild_core_data.py --online --schools-only
python3 scripts/rebuild_core_data.py --online --limit 40
node --test tests/condo-ranking.test.js
```

Before any future run, update the snapshot date only after obtaining fresh evidence. Online collection is sequential with a two-second interval and stops on 429. Successful results within this new rebuild are reusable; this is not the legacy cache. Complete project geocoding is not finished. Missing matches are not evidence that a development does not exist. Do not run online rebuilds concurrently. Main-page output is schema version 2; the old build/export scripts must not overwrite it.

## Distance Order And URA Reference Prices

The condo page now lists all matched projects by increasing school-point distance, with no recommendation rank numbers or listing/budget score. A selectable 800/900/1000/1200/1500 sqft area is a hypothetical size, not verified bedroom or layout availability.

`site/condo-pricing.js` uses the latest 12 complete calendar months relative to the transaction download date. It takes the arithmetic mean of each eligible transaction's SGD / (sqm × 10.7639104167), then multiplies by selected sqft. Only individual strata condominium/apartment/EC resales are eligible. New sale, sub-sale, bulk sale, invalid and future records are excluded. Fewer than three transactions do not produce a total-price estimate. Floor, facing, condition, actual layout and taxes are not priced; no accuracy claim or valuation is implied.

On 2026-10-06, one official batch containing 19,783 transaction records was acquired. Status is `partial`, not national coverage. Later URA requests encountered a source challenge and were stopped; do not retry or bypass it. The official property portal is https://www.ura.gov.sg/property-data/private-residential-properties/. Original authorized batches can be imported using:

```sh
python3 scripts/import_ura_transactions.py --retrieved-on YYYY-MM-DD --batch 1 --batch 2 /path/to/ura-batch-1.json /path/to/ura-batch-2.json
node --test tests/*.test.js
```

The importer rejects unsupported schemas, empty/failed responses and ambiguous repeated projects across batches. Explicit batch numbers must match the input file order; only all four distinct batches claim complete coverage. Unidentified imports remain partial and cannot publish a price snapshot without verified batch identities. Identical public transaction fields within an official project are retained as distinct records. Do not pass credentials in arguments or store them in public site files. REALIS CSV exports require a separately verified field mapping; this script accepts only original API JSON.

Local Access Key configuration and automatic four-batch download are implemented in `scripts/fetch_ura_transactions.py`. Follow `URA_SETUP.md`; never paste credentials in chat. Both helpers use current official v1 URLs and `typeOfArea` fields, not legacy API paths. Raw downloads reside in ignored `.private/ura`, outside the public website.

## Alternative Evidence Snapshot

The retained first batch adds 196 uniquely identifiable non-landed project points, converted from SVY21 (EPSG:3414) to WGS84. The generic name `RESIDENTIAL APARTMENTS` appears at multiple coordinates and is excluded from project discovery and price matching. The combined catalog now contains 279 project points; 239 occur within 2km of at least one current school. Henry Park has 23 matched projects.

Published Cashew directory links supply 70 project pages with separately labelled public transaction samples and any publisher-listed layout areas. Only 49 of these supply usable resales in the latest 12 complete months. A price/area/PSF inconsistency on Boon Teck Towers was rejected. Pine Grove's directory link had an inconsistent project title and was not guessed or matched by URL alone. Three explicit full-name variants are recorded in the collector; no fuzzy name matching is used.

Of the 239 nearby projects, 129 have usable original URA resale evidence, 49 have secondary resale samples, and 61 have no usable price evidence. The secondary mean uses the publisher's rounded PSF, not original URA fields. These samples may omit transactions and unit-count indicators; they are not a complete project annual average. Original and secondary records are never pooled. Only 91 nearby projects support a 1000 sqft reference estimate under the minimum-three-records and within-observed-size-range safeguards. Estimates are not valuations or available listings.

The alternatives use no credentials and do not contact URA or OneMap. To refresh public evidence through actual directory links:

```sh
python3 scripts/supplement_property_data.py --public --limit 100
node --test tests/*.test.js
python3 -m unittest discover -s tests -p 'test_*.py'
```

Daily raw HTML is cached under `.private/property-evidence/YYYY-MM-DD` with URL hashes. Page hashes, source links and retrieval dates are retained in the normalized evidence. Challenge pages stop collection. Existing dated evidence is not relabelled as fresh. Credentials, all original downloads, generated transaction/evidence JSON and generated URA point inputs are ignored by Git.

`npm run data:prices` derives the versioned public `site/data/condo_price_summary.json` offline from the two local evidence files. It exports aggregate means, sample counts, area/month ranges and provenance, never individual transaction rows or layouts. The current summary has 178 nearby projects with usable primary or secondary evidence. Primary and secondary aggregates remain separate; official coverage remains partial. A failed generation retains the previous snapshot. The main pages no longer fetch the ignored files. A Git-only build needs only the tracked public snapshot, not private data provisioning.

## Git Tracking Rules

`data/cache/`, rebuild raw downloads, progress logs and rebuild JSON intermediates (including coordinates, schools, projects and audit) are local-only. The manual `property-exclusions.json` and this README remain tracked. Ignoring a coordinate cache does not make source access restrictions disappear; preserve the local files when an authorized refresh is unavailable.

The published school/condo bundles and the derived public price snapshot under `site/data/` remain tracked so a fresh checkout can run and build the core website. The two transaction/sample files keep their local-only rules and are explicitly excluded from the release output. Root-level manual profiles, query overrides and CSV inputs are not removed by this cache cleanup. Removing files from the Git index does not delete their local copies or erase earlier commits. See the root README for release validation and CI.
