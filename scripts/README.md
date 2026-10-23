# Editorial generators

All scripts use Python 3’s standard library. No network request or package installation is required to generate or structurally validate the publication. Source-link and factual checks remain editorial work.

## Canonical inputs and generated outputs

`data/tracker.csv` is the single source of truth for deal facts. `data/institutions.json` is the 19-name Tier 1 registry. Optional `data/tier2-institutions.json` explicitly registers additional US tracked institutions; counterparties are never silently promoted into the tracked universe.

`data/evidence.json` is an object keyed by Record ID. It adds `seed_kind` (`baseline`, `backfill`, `new`), `latest_event_date` for substantive updates to older deals, `source_note`, `scope_note`, and optional `verified_status`. The canonical Status is a lifecycle field and never accepts Baseline. Initial inventory is the independent `seed_kind: baseline` label. Use Unknown when current lifecycle is not established; do not infer it from a date. `facility_status` distinguishes a planned associated hospital from an active advisory engagement; `status_note` explains that scope. Generated records retain the additional `sources` array. Major secondary-sourced events require a `sources` array with two independent reputable reports; structural domain checks cannot establish editorial independence. Official LinkedIn items need `linkedin_archive: {post_date, full_text, official_verified: true}`.

Historical backfill uses the fixed **2025-10-20 through 2026-10-19 inclusive** window: 12 months before launch on 2026-10-20. `BACKFILL_START` and `LAUNCH_DATE` enforce this window against the original announcement date or evidenced `latest_event_date`; baseline dates are not forced into the historical window. Source standards remain identical. `data/tracker.json` exposes `launch_date`, `backfill_start` and `backfill_end` for readers and interface labels.

When an event’s month is known but its day is not, keep both `Announcement date` in the CSV and evidence `latest_event_date` blank, and set evidence `event_date_month: "2026-01"`. The generator emits `latest_event_month: "2026-01"` and `event_date_label: "2026-01 (day not disclosed)"`; it never fabricates a day. A backfill month must fit wholly inside the fixed window, so January 2026 is valid while October 2025 and October 2026 are not. Invalid months and conflicting exact-day/month inputs are rejected.

Optional evidence `events: [{"date":"2026-01", "summary":"A sourced milestone.", "source_url":"https://official.example/news/milestone"}]` retains the agreement’s historical milestones in tracker JSON. Dates can be precise days or sourced months; each event needs a nonempty neutral summary and direct HTTPS evidence link. These remain events of the original record, not additional deals.

`data/coverage.json` is an array of `{institution, scope_checked, unresolved, backfill_status}`. `unresolved` may be an array or a string. Record gaps explicitly; an empty inventory is not proof of no activity.

`data/release.json` supplies the committed `as_of` inventory date. To advance the release, update this date and evidence dates honestly, generate, review and commit everything together. `--as-of` can override it for a controlled check.

```bash
python3 scripts/generate.py
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
python3 scripts/package_site.py
```

The generator deterministically writes `data/tracker.json`, `data/tracker.md`, `data/briefs.json`, `briefs/INDEX.md`, all 19 institution Markdown profiles and `SEED-REPORT.md`. Repeating it without changing the inputs produces identical bytes. `--check` writes nothing and exits nonzero when a projection is stale. It does not overwrite the CSV or evidence.

## Exact CSV schema

Use UTF-8 CSV with this exact ordered header row. Quote fields containing commas, quotation marks or line breaks according to standard CSV rules.

```text
Record ID,Institution,Partner/Counterparty,Country,Region,City,Tactic (primary),Tactic (secondary),Status,Announcement date,Operational date,Headline summary,So-what (1–2 lines, labeled analysis),Source URL,Source type,Source date,Last verified,Change log
```

- IDs are stable sequential `IHB-0001` values. Do not renumber or reuse them.
- A shared deal uses one row, with tracked institution names separated by `;`.
- Primary tactic is `T1` through `T11`; optional secondary tactics are `;` separated, without repeating primary. Apply the documented tiebreak order.
- Country uses an explicit mapping in `COUNTRY_REGIONS`; unsupported spellings fail rather than silently assigning a region. Add a reviewed mapping when expanding to a new country.
- Dates use `YYYY-MM-DD`, or an empty cell when the linked source does not disclose them. `Last verified` is required. An undated page is not assigned its crawl date.
- The So-what cell starts with `Analysis: `. Source type is exactly `Primary`, `Secondary`, or `Official LinkedIn`.
- Source URL is a direct HTTPS page, not a homepage. Record source facts precisely; validation cannot prove a factual claim or guarantee a URL still works.
- Change log is append-only editorial history with dated entries. Original dates stay intact when an older deal is updated; put the current event date in evidence metadata.

## Edition files and archive metadata

Do not create an edition when no material item passes editorial review. Seeding never creates backdated editions.

For each real edition create `briefs/YYYY-MM-DD.md` and `briefs/YYYY-MM-DD.json`. The Markdown follows the [runbook](../RUNBOOK.md). The JSON is the archive’s filter/index input and contains:

```json
{
  "date": "YYYY-MM-DD",
  "headline": "A one-line factual summary",
  "coverage_start": "An ISO-8601 timestamp with UTC offset",
  "coverage_end": "An ISO-8601 timestamp with UTC offset",
  "scan_completed_at": "An ISO-8601 timestamp with UTC offset",
  "items": [
    {
      "record_id": "IHB-0001",
      "section": "institution",
      "headline": "The sourced event",
      "summary": ["Sentence one.", "Sentence two.", "Sentence three."],
      "analysis": ["First analysis line.", "Second analysis line."],
      "source_urls": ["https://official.example/news/specific-release"]
    }
  ],
  "weekly_synthesis": "Required on Friday; omit on other days if not applicable."
}
```

The template is documentation, not a publishable edition. The generator fills institution, country, region and tactic tags for record-linked items from the CSV; metadata cannot override them. Each Record ID must exist in the CSV and appear in the Markdown. The Markdown must contain `## Market Signals` and `## Tracker changes`. A Friday edition needs `weekly_synthesis`.

A Market Signal item uses `section: "market_signal"` and may omit `record_id` because foreign operators are not tracked institutions. Supply its country, region and tactic tags, headline, 3–5 summary sentence entries, exactly two analysis lines and direct source URLs. Keep its materially scaled US-relevance anchor explicit. The JSON edition body and Markdown must be reviewed together; the structural checks do not establish semantic equivalence.

`data/briefs.json` exposes `{editions: [...]}` sorted newest first. Each edition includes the metadata, Markdown, `url`, deduplicated `record_ids` and filter tags (`institutions`, `countries`, `regions`, `tactics`). Deal counts and edition counts describe different things and are never equated.

## Publishing artifact

`package_site.py` creates `_site/` from an explicit allowlist: reader HTML, assets, map, data, briefs, institutions, and reader-facing methodology and the markets, compare, coverage and updates routes; internal runbook/QA files stay in GitHub. It excludes Git metadata, research working files, Python tests and workflow files. Pages deploys these static bytes, not an application server.

The GitHub Actions workflow runs tests, verifies current generated outputs, stages the static tree and deploys it through GitHub Pages. A successful local check is not a live deployment. Confirm the Pages deployment’s URL and run the browser journeys against it before declaring publication verified.

Official deployment reference: [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Reader behavior checks

Run `node --test tests/test_reader.mjs` (Node 22 or newer). These checks use the actual seed for combined filters and shared-deal membership, plus bounded fixtures for post-launch and Market Signal cases. They do not replace desktop/mobile browser QA. The Pages workflow runs these alongside the Python suite.

## Reader version 2026-10-21.1

`data/release.json` retains `as_of: 2026-10-20` for the checked source inventory and adds `reader_version: 2026-10-21.1`. Schema version 2 separates lifecycle from inventory history, adds Unknown, splits the former Other region into Africa and Middle East, and adds the T10 research category. Existing record IDs and source dates are preserved.

The CSV retains its 18-column canonical contract. Evidence sidecars hold `seed_kind`, `facility_status`, `status_note`, source scope and provenance. Generated projections must never be edited directly. The filtered reader export is a different, expanded 32-column view containing the record evidence plus view metadata; do not substitute it for the canonical CSV.

Development-only Node dependencies provide formatting and DOM integration tests. Production remains static and has no runtime npm dependency. Run `npm ci --ignore-scripts` before the Node suite. The tests use jsdom with the production entrypoint and actual inventory; they check controls, source rendering, history, export content and recovery, but have no browser layout or visual output.


## Reader 2026-10-22.2 and covered markets

The October 22 reconciliation advances the explicit inventory `as_of` to 2026-10-22 and reader version to 2026-10-22.2; individual source dates and original event dates remain intact. A checked date is not a publication date or event date.

Evidence may include `covered_countries: ["Bahamas", "Cayman Islands"]` for a single explicitly sourced multi-market relationship. Every value must be registered, unique, and the array must include canonical Country. `representative_location_note` is a string distinguishing services available in a market from staffed-office geography. The generator preserves both fields; the CSV remains canonical for the relationship, and generated country totals use the union. Global relationship totals remain unique IDs. Reader CSV includes these fields with the other evidence metadata.

Primary reader eligibility is shared `status === "Operational"`; canonical projections retain all statuses. Do not filter generated JSON to delete history. Dedicated tests cover metadata validation, served-market selection, scoped comparison, current-only views and historical deep links.
