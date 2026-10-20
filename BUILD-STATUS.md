# Build status — 2026-10-20

The static implementation is prepared and structurally tested. This is not a claim of a complete production launch.

## Delivered source

- Public-facing overview, interactive map, sortable/filterable tracker, institution views, methodology reader and brief archive.
- Canonical 19-column CSV; deterministic derived JSON, Markdown tracker, 19 institution profiles and seed report.
- 98 records: 84 baseline and 14 historical backfill, across 38 countries. Fourteen Tier 1 institutions have seeded records; all 19, including Dana-Farber Cancer Institute, have profiles and coverage notes.
- One shared MGB/Dana-Farber agreement is one global record with both institution memberships. Per-institution totals can exceed the global deal count.
- Complete editorial methodology and source standard, production runbook, change logs, evidence notes, held candidates, generator, test suite and GitHub Pages workflow.
- All reader assets are local. No runtime backend, API key, tile service, tracking, logos or login.

## Executed checks

- 24 Python tests: editorial validation, lifecycle/date/source boundaries, duplicate/shared records, deterministic projections, edition metadata and public staging.
- 10 Node tests: actual seeded filter results, compound filters, shared membership, post-launch activity, URL roundtrips, signal-only archive filtering, Markdown safety/rebasing, CSV formula handling and map-locator coverage.
- Generator `--check`: 24 derived projections match the canonical inputs.
- JavaScript syntax checks, staged HTML link resolution and public asset packaging completed. Pages workflow action versions were checked against current primary documentation; remote execution remains unverified.
- Fresh independent source/code review found missing publication assets, future-activity and archive boundary problems. These were repaired and checked. Active-year display and signal-only archive-country choices were also corrected.
- Ten representative source records rechecked in the managing review; see SOURCE-AUDIT.md. Broader per-record evidence is in data/evidence.json.

## Unfinished acceptance criteria

1. **Research completeness.** This is a partial sourced inventory, not an exhaustive baseline or 12-month historical backfill. Detailed per-institution gaps are in SEED-REPORT.md. No qualifying record was established in this bounded sweep for Boston Children's Hospital, Children's Hospital of Philadelphia, Texas Children's Hospital, Stanford Medicine or NYU Langone Health. That is not a zero-footprint conclusion. Tier 2 and Market Signal coverage need the editorial sweeps described in RUNBOOK.md.
2. **Browser QA.** The supported managed preview could not start because its sandbox could not mount `/proc`. Consequently desktop/mobile visual layout, real interaction journeys, touch, keyboard focus, downloads and browser back/forward behavior remain unverified. Unit/static checks are not browser evidence. The procedure in VERIFICATION.md remains a draft pending the first complete browser journey.
3. **GitHub/Pages publication.** The public GitHub repository has been created under the connected account. Pages is configured to use GitHub Actions; the source push and first deployment are pending. No live URL is claimed until the deployment is observed.
4. **Daily production.** The editorial workflow is encoded. No brief has been fabricated and no edition has been backdated. No complete current 24-hour scan is claimed; the first daily edition and any recurring operating schedule remain to be established.

A reviewer should complete these checks before representing the publication as production-ready.
