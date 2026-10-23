# Production runbook

## Cadence and coverage window

When an editorial monitoring process is staffed, the target cadence is weekday mornings in **America/New_York**, observing daylight saving time. Cover the prior 24 hours; Monday covers Friday’s prior run through the weekend. Record exact start/end timestamps and the scan time in edition metadata. Run a Tier 2 sweep weekly. A launch seed is an inventory, not an edition.

No material news means no edition. Record the completed scan in the editorial log without publishing an empty post. An uncompleted scan must not be described as a no-news day. This repository documents the workflow; it does not install a scheduled agent or imply unattended editorial coverage.

## Daily production flow

1. Scan the 19 Tier 1 institutions’ official newsrooms and international-arm pages, foreign counterparties’ official announcements, relevant governments, reputable secondary outlets and verified official LinkedIn company pages. Use individual social posts only as leads to acceptable evidence. Sweep Tier 2 weekly.
2. Apply [the methodology](./METHODOLOGY.md) to every candidate: actor eligibility, in-scope operational substance and exclusions, needle test, then sourcing. Fail any step and exclude; hold borderline items.
3. Open the exact source. Check every proposed factual claim, figure, name, country and event date. Distinguish an MOU or intention from a signed agreement, construction and operation. Save the evidence scope and link. Do not use internal knowledge.
4. Deduplicate against Record IDs and existing institution/partner/country relationships. Update the original record for signing, opening, expansion, renewal, ownership change, restructuring or exit. Never delete an exited record. Record the original event date and latest update separately.
5. Draft the edition. Group institution items by the current regions, Tier 1 first. Market Signals are a secondary section and never lead. Use a neutral, precise executive voice; no hype or invented color.
6. Perform the per-item QA below. If no candidate remains, publish nothing.
7. Update `data/tracker.csv`, `data/evidence.json` and any coverage notes. Add `briefs/YYYY-MM-DD.md` and same-name `.json` metadata. Generate the tracker, map dataset, profile pages, archive and seed report in the **same commit** as the brief.
8. Execute structural tests and reader journeys, inspect desktop and mobile rendering, check source links, review the exact diff, and publish only the coherent commit. Confirm the returned live Pages URL and deployment status.

## Required brief format

- H1: date and one-line headline summary.
- Region headings in the product’s taxonomy; Tier 1 items precede Tier 2 items.
- Each item: headline; **3–5 sentence** neutral summary; **So what for US hospital strategists — Analysis** followed by **exactly two lines** that introduce no new facts; direct source link(s); Record ID.
- `## Market Signals`: only qualifying, materially scaled signals with a stated US-relevance anchor. If there are none in an otherwise substantive edition, say none met the filter; never fill the section with routine local news.
- `## Tracker changes`: new/updated Record IDs with concise changes.
- Friday: `## Weekly synthesis`, explaining the week’s pattern rather than listing a recap. Put the same synthesis into the edition metadata.

Backfill items are tracker records with actual event dates, never fabricated historical editions. A brief’s historical summary remains tied to the contemporaneous source; a later lifecycle change updates the tracker and appears in a new edition when material. Corrections are dated in the original item and in its record’s change log.

## Per-item QA

- Acceptable source type, direct working URL and correct source date?
- Every fact and number found in a linked source, with no private knowledge or inferred operating status?
- Major opening, JV, management agreement or exit supported by a primary source or two independent reputable reports?
- Official LinkedIn source verified as the company page, substantive facts present, full text and date archived, and press-release upgrade checked?
- Institution and counterparty names exactly as sourced; shared deals stored once?
- Country where the activity occurs, correct region, and tactics assigned by substance and tiebreak order?
- Original dates, latest-event date, status and evidence-scope notes consistent?
- Deduplicated Record ID; status changes and corrections in change log; no silent deletions?
- Needle-test relevance and two-line analysis explicit, with no new factual claims in analysis?

## Partial dates and historical milestones

Keep exact-day CSV fields blank when the source gives only an event month. If both the announcement date and latest-event date are unknown, record `event_date_month: "YYYY-MM"` in evidence; do not borrow the article’s publication date as the event date or assign a day. For historical backfill the whole known month must fall inside 2025-10-20 through 2026-10-19: January 2026 qualifies; October 2025 and October 2026 do not. The sourcing standard remains unchanged.

Retain distinct sourced milestones for one deal in evidence `events`, each with its date (exact day or known month), neutral summary and direct source URL. They update the same Record ID and do not create duplicate deals. Review their factual claims just as closely as the headline event.

## Data and edition commands

```bash
python3 scripts/generate.py --as-of YYYY-MM-DD
python3 scripts/generate.py --check --as-of YYYY-MM-DD
python3 -m unittest discover -s tests -v
```

The explicit `--as-of` date must match the validated inventory, evidence verification dates and release. The launch snapshot uses 2026-10-20 by default. When advancing it, update the committed `data/release.json` date too; the workflow reads that date by default. Never change a source date merely to make a check pass.

See [scripts/README.md](./scripts/README.md) for the CSV contract and required JSON metadata. Review [VERIFICATION.md](./VERIFICATION.md) for all four map tasks, combined filters and mobile checks.

## Seeding and reconciliation

The launch historical backfill covers the **12 months from 2025-10-20 through 2026-10-19 inclusive**, before launch on 2026-10-20. This is a fixed launch window, not a rolling window. Historical records meet the same sourcing and editorial standards as current news; age does not relax verification. Search each Tier 1 institution for qualifying events in this window and inventory existing overseas facilities, JVs, management agreements, offices and material operational affiliations. Use the same sourcing standard as a current edition. Keep unverifiable candidates out and list their gaps in coverage notes.

`data/coverage.json` records what was checked, backfill status and unresolved sourcing questions for each institution. The generator reports baseline/backfill totals and per-institution participation in [SEED-REPORT.md](./SEED-REPORT.md). A shared deal counts once overall and once in each participating institution’s profile; per-institution counts therefore need not sum to the global record total.

## Failure and corrections

A failed source, ambiguous MOU, missing date or insufficient major-item evidence is a hold, not permission to infer. Restore generated files from the canonical CSV after fixing the source data. A failed deployment does not establish publication: retain the reviewed commit and retry that deployment after resolving the failure. Label prepared, structurally tested, browser-tested and live-deployed evidence separately.

For an already published correction, retain the Record ID, append a dated correction note to the item and change log, explain the source-supported replacement, regenerate all projections and publish one atomic commit. Exits remain in canonical history and full direct-link evidence, outside the current-only reader.

## Reader release 2026-10-21.1

The canonical Status field now stores lifecycle, including Unknown, independently of `seed_kind`. Never restore Baseline as a lifecycle to preserve an old filter. Old `status=Baseline` URLs resolve to initial-inventory history instead. Do not infer active status from listing, a dated announcement, or an old agreement. Use the explicit `facility_status` sidecar for a planned facility associated with active advisory work.

Research partnerships under the revised methodology must be reviewed against that policy before previously held candidates enter the CSV. The Research focus is available but its systematic coverage remains pending. Do not turn the policy change into invented records or a completed-scan claim.

Reader versions and source inventory dates are separate in `data/release.json`: `reader_version` identifies a software/content presentation release; `as_of` identifies the checked source inventory. A UI or classification release does not advance source dates.

Before publishing UI changes, execute the desktop/mobile journeys in VERIFICATION.md. A passing jsdom integration suite is not browser or visual verification. A release can be saved as a draft PR while the browser gate is outstanding.

## Combined reader taxonomy

Use T10 for research partnerships and T11 for insurer partnerships. An insurer agreement retains supported consulting or patient-access activity as secondary tags. In-Country Representative (T6) follows the official hospital-listing standard in METHODOLOGY.md. Keep Africa and Middle East (non-GCC) separate, including the Caucasus in the latter. Both Middle East labels and legacy Other shared links remain compatible. Profile defaults are map-first; the global mobile explorer defaults to List. Regenerate all projections after canonical CSV changes. Reader integration does not advance inventory or source-verification dates.


## Current reader 2026-10-22.2

Use the shared `isCurrentRecord` Operational predicate across Explore, Institutions, Markets, Compare, tracker, aggregates and developments. Never promote uncertain rows to fill a sparse screen. Remove status/history controls only from primary reader workflows; preserve canonical status, history, corrections, source evidence and direct links. Do not add an inactive archive UI in this release.

An explicit current service directory or Active Projects page can support the precise relationship it offers, after direct source review. Record exact claim, checked date, status rationale, source limitations and append-only corrections. Do not infer activity from an announcement, page existence or lack of an exit. Preserve associated-facility caveats.

For a single sourced multi-market representation, use validated evidence `covered_countries` (including canonical Country, registered spellings, no duplicates) plus `representative_location_note`. Keep one ID; distinguish a documented market served from a physical office. Re-run generation, country filtering, map selection, comparison scope and unique-ID tests. The October 22 per-record [reconciliation](docs/research/reconciliation-2026-10-22.md) is a bounded source review, not a completed monitoring scan.

Keep reader/UI and editorial changes reviewable in separate commits. Update VERIFICATION.md and design-qa.md for the actual candidate; historical screenshots cannot establish a new visual pass. Browser-blocked candidates may be saved only as draft PRs. Do not merge or deploy until the separately authorized publication gate is completed.
