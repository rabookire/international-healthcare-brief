# International Healthcare Brief

Public-source intelligence for U.S. hospital international-program leaders: discover who is active in a market, understand the documented relationship, and compare two or three institutions.

[Live main release](https://rabookire.github.io/international-healthcare-brief/) · [Methodology](METHODOLOGY.md) · [Verification](VERIFICATION.md)

## Prepared reader 2026-10-22.2

This candidate brings the map and activity list directly beneath compact filters. Neutral anchored clusters keep country boundaries readable; the legend stays visible. Markets groups concrete activities by institution, Compare provides two searchable institution slots with an optional third, and profiles retain a dominant map and recent developments.

Explore, Institutions, Markets, Compare and the table use the same current-view rule: canonical `status === "Operational"`. Status and inventory-history controls are removed from these workflows. All other relationships and their evidence remain in canonical data; direct links explain when a record is outside the current view. There is no new inactive browsing section.

The reconciled inventory contains **110 unique records**, including **74 Operational**, 29 Unknown, six Announced and one In development. All 98 original IDs and original announcement/operational dates survive; 12 new relationships were admitted and 41 previously Unknown relationships received explicit current-status evidence. The source inventory date is October 22, 2026; individual checked dates are preserved. This bounded review is documented in [the reconciliation log](docs/research/reconciliation-2026-10-22.md), including holds and source limitations. It is not an exhaustive scan, ranking, market-share measure or claim of no activity where evidence is missing.

**This is a draft candidate.** Automated checks and independent source review have run. Browser-rendered desktop/mobile screenshots and visual QA are outstanding; see [design-qa.md](design-qa.md). Prior release screenshots do not establish this candidate's behavior. No merge or deployment is requested.

## Build and verify

Production is static HTML/CSS and native JavaScript modules. It has no backend, account, tracking or production npm dependency. The CSV and evidence sidecars feed deterministic Python projections. Node dependencies are development-only.

```bash
npm ci --ignore-scripts
python3 scripts/dev_server.py
```

Use the HTTP address printed by the server. After changing canonical inputs, regenerate and check:

```bash
python3 scripts/generate.py
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
npm test
npm run format:check
python3 scripts/package_site.py
```

Core modules: `assets/core.mjs` (filters, current eligibility, covered markets, URLs and CSV); `assets/map-camera.mjs` (camera and anchored clusters); `assets/presentation.mjs` (shared activity summaries); `assets/pages.mjs` (Markets/Compare); `assets/profile.mjs` (institution profiles); `assets/record-view.mjs` (evidence); `assets/app.mjs` (orchestration).

Primary sources, the existing 19-institution cohort and editorial needle test remain the inclusion standard. Representatives, insurer access, advisory work and care-delivery facilities retain distinct meanings. Served-market locators do not prove staffed offices, and active advisory work does not make its associated planned hospital open. Read [the editorial runbook](RUNBOOK.md) and [data contract](scripts/README.md) before editing facts. Unknown status does not mean inactive.

GitHub Actions validates pull requests. Publication runs only from main or an explicitly triggered main workflow. Confirm the exact deployed commit and returned Pages URL before reporting a release live.
