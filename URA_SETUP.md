# URA Local Access

Official documentation checked on 2026-10-06:
https://eservice.ura.gov.sg/maps/api/#private-residential-property-transactions

Register for an Access Key:
https://eservice.ura.gov.sg/maps/api/reg.html

Complete registration, consent to the terms yourself and follow the account activation email. The official API requires the activated account's Access Key and a daily Token. The current v1 private residential transactions service supplies five years in four batches. It reports price, floor area, sale type, floor range, tenure and month; it does not report bedroom count or exact transacted-unit coordinates.

## Configure Once

In a terminal:

```sh
cd /Users/byc/src/webschool
python3 scripts/fetch_ura_transactions.py --configure
```

Paste the Access Key into the hidden local prompt, not into chat or a command argument. The helper creates `.env.ura` with owner-only permissions (600) and refuses to overwrite it. Alternatively an existing `URA_ACCESS_KEY` environment variable is accepted. The script does not execute arbitrary contents of an environment file.

`.env.*` and `.private/` are excluded from Git and root Vercel deployment. Neither is under `site`, so static-only deployment does not contain them. Never put credentials in browser JavaScript or site data. To rotate the key, edit the existing private file locally and retain permission 600; do not send the value in chat.

## Download And Update

```sh
python3 scripts/fetch_ura_transactions.py
```

The helper obtains a daily Token from the current official `insertNewToken/v1` endpoint, downloads `PMI_Resi_Transaction` batches 1-4 through `invokeUraDS/v1`, and retains original transaction responses under `.private/ura/<timestamp>/`. It only sends credentials to the fixed official endpoints; HTTP redirects fail closed. The Token is never written to disk or printed.

All batches must succeed before public `site/data/ura_transactions.json` is replaced atomically. Failed HTTP requests, rejected authentication, non-JSON challenge pages, invalid fields and ambiguous repeated projects stop collection without overwriting current data. Do not bypass a challenge or access restriction. If approval does not include this service, contact URA or obtain an official export through its property portal.

The importer maps `typeOfArea: Strata`, `typeOfSale: 3` (resale), `area` in square metres and `contractDate` in MMYY, per current official documentation. Distinct transactions with identical exposed fields are retained, not silently deduplicated. Price calculations exclude land-area, multi-unit, new-sale and sub-sale records. Missing bedroom counts are never inferred from area. Selected sqft is a hypothetical estimate size, not an actual verified layout.

## Verify

```sh
PYTHONPYCACHEPREFIX=/private/tmp/webschool-pycache python3 -m unittest discover -s tests -p 'test_ura_pipeline.py'
node --test tests/*.test.js
```

Tests use synthetic fixtures only; test success is not evidence that real transactions were downloaded. Before release, review actual batch counts, source dates, project-name matches and per-project price coverage. Static preview deployment is a separate step and never needs the Access Key.

## Current Access Limitation And Alternative

The actual 2026-10-06 run obtained batch 1 (19,783 records) but did not complete all four. A later request encountered a source challenge; no automatic retry or bypass is permitted. The public normalized file is now explicitly `partial`, recovered offline from the retained successful response. This is not a successful four-batch download.

The alternative collector `scripts/supplement_property_data.py --public --limit 100` reads public Cashew directory links and records secondary samples separately. It never calls URA or OneMap and never sends the Access Key. Sample coverage, calculations and exclusions are documented in `data/rebuild/README.md`.

Both original downloads and generated transaction/sample files are Git-ignored. Do not force-add them. A Git-only deployment will not include these local files; school pages remain usable with missing prices clearly marked.
