# SG School-Condo

Public website: [SG School-Condo](https://webschool-theta.vercel.app/)

[School Explorer](https://webschool-theta.vercel.app/index.html) | [Nearby Condo Picks](https://webschool-theta.vercel.app/school-condos.html)

A bilingual static website for Singapore primary-school registration evidence and nearby condo distances. The maintained pages are `site/index.html` (School Explorer) and `site/school-condos.html` (Condo Picks). Older research pages are retained, not newly verified.

## Local Development

Requires Node.js 22+ and Python 3.9+. There are no npm dependencies.

```sh
npm run dev
# http://127.0.0.1:8013/index.html
npm test
python3 -m pip install -r scripts/requirements.txt
npm run test:python
npm run build
```

`npm run build` validates the school bundle, public price snapshot, their matching hash, source dates, batch coverage, required HTML assets and JavaScript syntax. It then creates `.build/site` with public files only. Missing or invalid price data stops the build before replacing the previous artifact. Build a fresh checkout without caches or private files to verify reproducibility.

## School Sorting

Use applicants / vacancies from the bundle's latest registration year, highest demand first. This is not individual admission probability. Zero vacancies and missing/invalid counts are not numeric ratios.

The ranking policy is selected once for the full school dataset and is unchanged by search, town filtering or language. If every school with usable demand data has a comparable 2C(S) ratio, use 2C(S), with 2C as a tie-breaker. Otherwise use 2C uniformly for the entire list. Schools lacking a ratio in the chosen phase go last. Fully missing schools do not trigger the fallback themselves. Name and slug provide deterministic tie-breakers.

This conservative fallback is deliberate: comparing one school's 2C with another's 2C(S) is misleading; falling back independently for each pair can create circular rankings. The page displays the active year, phase and fallback reason. Citizenship/distance groups remain attached to their original MOE phase and year.

## Price Data And Safe Releases

`site/data/atlas_bundle.json` and `site/data/condo_price_summary.json` are public, versioned release inputs. The price file is a derived aggregate snapshot, not an original transaction download. It contains average resale PSF, sample count, observed area range, transaction-month range, actual retrieval dates and separate primary/secondary attribution. Source input hashes and the school-bundle hash make updates traceable. Individual transaction rows, credentials, private paths and raw downloads are not exported into it.

Authorized local inputs stay ignored:

- `.env.ura` and `.private/`: credentials and original downloads.
- `data/cache/` and rebuild intermediates: source caches and generated working files.
- `site/data/ura_transactions.json` and `site/data/property_evidence.json`: normalized local evidence, excluded from the release output as well as Git.

After acquiring and validating authorized evidence using the documented import pipeline:

```sh
npm run data:prices
npm test
npm run test:python
npm run build
```

The price-summary generator is offline. It does not call URA or OneMap. A missing, empty or invalid input fails before writing, preserving the last successful public snapshot. Evidence dates are never changed to the build date. A change to the school bundle requires regenerating its matching price snapshot. Review and commit the public summary with the code; do not add the ignored source files.

Prices prioritize original individual strata URA resales. Public Cashew samples are kept separate and used only when primary resale summaries are absent. A reference price needs at least three records and a selected area within the observed range. It is not a valuation, an available unit or proof of a layout. Current official coverage is only batch 1 of 4; no build turns it into nationwide coverage. Snapshot windows remain relative to the evidence retrieval date, not the current day.

`vercel.json` runs the release gate and serves `.build`, retaining existing URL rewrites. `.vercelignore` allows the build scripts but excludes private data and nested CLI output. A public checksum manifest is generated at `/data/release_manifest.json`. Do not use old prebuilt CLI artifacts to bypass the build gate.

GitHub Actions runs the offline JavaScript and Python tests and the release build on pull requests and relevant pushes. This repository configuration does not connect Vercel to GitHub or change deployment protection; those remain separate project settings. CI does not download private data or deploy production.

## Data Limits

The school/project catalog and price coverage are incomplete. No matched project is not evidence of no nearby condos. School-point distances are approximate straight lines, not official MOE admission distances. The retrieved 2026 counts are cross-checked secondary data; absent 2026 MOE citizenship/distance groups are not inferred from 2025 results.

See `data/rebuild/README.md`, `REDESIGN.md` and `URA_SETUP.md` for provenance and authorized source handling. Do not use legacy `scripts/build_data.py` to replace the schema-2 main-page bundle. Do not retry or bypass source access challenges.
