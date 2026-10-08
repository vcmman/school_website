# SG School-Condo Redesign

The redesign is merged into `main`. Ranking and release safeguards are developed on `codex/ranking-release-safeguards`.

The main navigation contains School Explorer and Condo Picks, with bilingual selection, school search and registration demand history. Older research pages remain at their original URLs but have not been rebuilt and must not be used as a verified current source.

## Independent Data Pipeline

The core pages load the single schema-2 `site/data/atlas_bundle.json`. They do not read the legacy school dataset, investment inventory or old listing profiles. The bundle is replaced atomically so school and project versions cannot mix during refresh.

See `data/rebuild/README.md` for raw sources, provenance, refresh steps and limitations. `data/rebuild/audit.json` records coverage and source hashes. The legacy export scripts refuse to overwrite schema-2 data.

## Snapshot: 2026-10-06

- 182 current schools from freshly downloaded MOE SchoolFinder, with records updated 2026-10-05.
- 181 school points independently matched to new OneMap responses. One secondary-coordinate fallback is explicitly labelled.
- 2025 phase 2B, 2C and 2C(S) counts and citizenship/distance outcomes parsed directly from MOE original records.
- 2026 secondary counts cross-checked against an independent fresh compilation: 916 numeric cells agree. No official 2026 citizenship/distance cutoff data was obtained; missing outcomes stay unknown. Three schools have no 2026 count record.
- Over 2,700 condo/EC directory candidates, not verified residential developments. The combined catalog has 279 matched project points after adding 196 uniquely identifiable points from the retained official URA first batch. National geocoding remains incomplete.
- OneMap now reports that an authentication token is required. Collection stops on an API error or rate limit; no authentication bypass is attempted.
- No individually verified current sale listings have been acquired. Recommendation slots therefore remain empty; a separate nearby directory is clearly not a buying recommendation.

## Display Rules

Applicants divided by vacancies measures registration demand, not personal admission probability. Zero vacancies have no numeric ratio. Sorting uses a dataset-wide comparable phase: 2C(S) if all schools with usable demand ratios have that phase, otherwise 2C for the entire list. Equal 2C(S) values use 2C. Schools missing the selected ratio go last. Search and language do not change this policy. The fallback is explained on the page; phases are never compared against one another. Citizenship/distance results retain their exact original phase and year; historical outcomes never imply current eligibility.

Distances are school-point to a single matched project block, not official boundary-to-residential-block distances. Directory tenure and completion are unverified claims. Asking price, maintenance condition, amenities and valuation scores are never invented. Purchase candidates require fresh individual sale evidence and independently verified completion; sorting uses explicit budget/layout/asking-PSF criteria, not a purported market-value score.

The current condo page instead uses fixed nearest-first distance order, not buying recommendations. Reference pricing prioritizes original individual strata URA resales; separately labelled Cashew samples are used only when original resale evidence is unavailable. At least three records and a selected area within the observed range are required for a total estimate. Missing prices remain unknown. The explorer fetches no pricing payload. The condo page first renders school/distance controls, then loads the small versioned aggregate snapshot, with a timeout and translated retry state. Network failures are not presented as absence of transactions. Individual transaction rows and publisher-listed layouts are no longer published by the core pages. See the alternative-evidence snapshot in `data/rebuild/README.md` for actual counts and exclusions.

## Local Preview And Checks

Serve `site` over HTTP and open `index.html` or `school-condos.html`; direct file URLs cannot reliably fetch the bundle. Run:

```sh
npm test
npm run test:python
npm run build
```

This is a partial, evidence-labelled local preview, not a release-ready nationwide condo recommendation service. Completing property coverage requires authorized location data and verified current listings/transaction evidence.
