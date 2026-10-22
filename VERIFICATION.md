# Release verification

Prepared reader: 2026-10-21.1. Source inventory checked: 2026-10-20. Base: `f0f790747dc6969c99423c552391dc571cf74e27`.

## Automated checks

```bash
npm ci --ignore-scripts
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
npm test
python3 scripts/package_site.py
```

The combined local candidate contains 27 Python checks and 39 JavaScript checks (five camera, 11 existing reader, six research semantics, six profile checks, eleven DOM integration journeys). The integration suite executes the production reader with the real inventory in jsdom. It checks controls, combined filters, result counts, map shading, URL/history, source details, focus restoration for tested controls, CSV content, country briefs, shared comparison IDs, print invocation and loading recovery. It does not render layout, capture screenshots, inspect the browser accessibility tree, simulate real touch behavior or verify actual downloads/printing.

## Required real-browser journeys

Use desktop 1440×1024 and mobile 390×844, plus 320px reflow and 200% zoom. Capture actual screenshots for each important state. Desktop/mobile screenshots and the local integration execution record are supplied below and in the local handoff evidence; physical touch and assistive-technology checks remain outstanding.

| Step | Task | Expected result |
| --- | --- | --- |
| 1 | Open home | Audience, partial scope, 98 records/38 countries, coverage link and search are clear. |
| 2 | Filter UAE + Active/operational | Exactly IHB-0003 and IHB-0071 match. Open evidence and confirm facility versus advisory roles. |
| 3 | Open IHB-0072 | Active advisory work and its planned associated facility remain clearly distinct. |
| 4 | Filter T9 and then research | T9 gives 42 records and explains secondary matches. Research gives an explicit unreviewed-coverage notice. |
| 5 | Filter Vietnam; add Mayo | Country gives two records; Mayo + Vietnam gives none. The all-country context explicitly ignores other filters. Shading follows matching pins. |
| 6 | Combine institution, country, activity, lifecycle, history and year | Results match the canonical filters. GCC + T3 and Saudi 2026 openings remain honest zero-result views. |
| 7 | Select and close details; sort, search, clear, back/forward | No lost keyboard focus, unexpected filter changes or inaccessible selection. Copy/reopen a view and record link. |
| 8 | Use mobile List/Map switch | Search and filters remain visible; list is default; details stay reachable without forcing map navigation. No horizontal page overflow. |
| 9 | Use map with mouse, keyboard and touch | Drag/pinch/zoom, pin navigation, wheel-scroll handoff, reset and expanded mode work. Background is inert in expanded mode; Escape and focus restoration work. Overlapping hit regions do not hide records. |
| 10 | Export filtered CSV | Actual downloaded file opens correctly and retains lifecycle, facility state, scope, source notes, additional URLs, month precision, version/hash and query. |
| 11 | Open Vietnam country brief and institution profile | Country/profile counts and citations agree with data; source links work; printed output includes provenance and caveats. |
| 12 | Compare MGB and Dana-Farber | IHB-0081 appears in both columns and only once in exported records. Counts are not presented as rankings. Add a third institution; remaining choices are disabled. |
| 13 | Open coverage, updates and methodology | Nineteen coverage entries, explicit research gap and no fabricated edition. Methodology still loads when tracker/evidence/brief requests fail. |
| 14 | Check contrast, focus, screen reader, loading and errors | Labels, heading order, focus indicators, status announcements and error recovery are usable. Inspect browser console errors. |

## Editorial review

The lifecycle migration uses existing evidence notes, not a new source scan. Source dates and verification dates remain unchanged. Before adding facts, open the exact primary sources and verify factual entailment, lifecycle, event dates and roles. Research candidates require reassessment under the revised methodology; old exclusions are not automatically admitted.

## Publication

Keep the change in a draft PR until the real-browser journeys pass and screenshots are inspected. Automated checks alone do not establish a visual pass. After merging, confirm the exact deployed commit, successful Pages run and returned Pages URL, then test subdirectory asset paths and critical live journeys. An expected URL is not evidence of publication.

Earlier execution logs and design references belong to the previous commits in Git history; they are not evidence for this release.

## Local integration of PR #2 and merged PR #3 — October 22, 2026

Exact inputs: PR #2 `a3fb3745a6a7658292b6d9b9aecc3c42c9b572b6`; main / PR #3 merge `e796227309268c0b34a1e18fbc177219fd9a6740`; merge-base `f0f790747dc6969c99423c552391dc571cf74e27`. This record applies to the supplied local source copy, not a deployment or a committed integration.

All 24 projections were regenerated from the reconciled canonical CSV. All 98 IDs, original source facts and dates, source-verification dates, and the 84 initial / 14 historical classifications are preserved. T10 Research and T11 Insurer Partnership coexist. T4 consulting remains a secondary tag on IHB-0038. Main's Middle East (non-GCC) grouping is canonical, with both Middle East spellings and Other accepted by the reader. Both dated classification histories are retained.

The combined reader preserves map-first institution profiles and three recent developments, alongside lifecycle/facility distinctions, country briefs, comparisons, source details, scoped exports, keyboard navigation and global mobile List default. Explicit Map/List URLs round-trip across both default contexts. The previous local mobile-focus and archive-country fixes remain included.

### Executed checks

- Generator regeneration and projection agreement; Python tests; all Node tests including jsdom; static packaging, local link/module checks and syntax checks.
- Chrome at desktop 1440×1024, mobile 390×844 and 320px reflow, plus actual browser 200% zoom (720 CSS pixels at a 1440px viewport). Screenshots were captured and inspected.
- Cleveland Clinic profile: 19 records and three sourced developments; Americas + T11 gives IHB-0017, Europe + T11 gives IHB-0093, Africa + T11 gives honest zero with recovery. Region changes clear a prior country constraint. Map/List, reload, back/forward, evidence access and focus restoration passed.
- UPMC secondary T2 gives IHB-0069 and IHB-0098; Mayo secondary T7 gives IHB-0096. A zero-record institution retains an explicit coverage gap.
- Global explorer: UAE + Operational gives IHB-0003 and IHB-0071. Vietnam gives IHB-0042 and IHB-0079; adding Mayo gives zero while all-country context keeps both records. T9 gives 42 records; research gives an explicit unreviewed-coverage notice. Other gives four records; either Middle East spelling gives two. Patient access + T11 finds all three insurers.
- Mobile List and Map selection dismissal restore visible focus. Arrow navigation continues between pins. Expanded-map background is inert; Escape restores the map control. Pointer dragging, keyboard pan and zoom controls change the camera correctly. No horizontal page overflow was observed.
- An actual one-record insurer CSV was downloaded and checked against the current dataset hash, filter query, T11 and evidence fields.
- Vietnam country brief retains two records and two citations. MGB/Dana-Farber comparison retains shared IHB-0081 in both columns and six unique citations. A third institution disables the other 16 choices. Long comparison headings wrap correctly on screen and in print.
- The final comparison print preview and saved PDF contain five pages and evidence for six unique records, including source dates, facility/status caveats, view filters and dataset hash.
- Desktop/mobile archive fixtures confirm edition-only Belgium and item-only Luxembourg remain selectable with combined filters. These clearly labeled test fixtures were served only by the loopback preview; canonical edition data remains empty.
- Coverage has 19 entries; methodology renders T10, T11, the representative definition and the region convention; Updates and the production archive continue to state that no edition has been published. No application console errors were captured.

Physical touchscreen/pinch behavior, screen-reader output, other browser engines and live deployment were not verified. Earlier branch/production observations are not evidence for this combined candidate. No commit, push, branch/PR merge or publication was performed.

## PR #2 revision and merge preparation — October 22, 2026

The combined candidate above is now prepared as the PR revision. It includes the comparison-header correction: `.comparison-table th` sets `white-space: normal`, overriding the inherited global `nowrap` so long institution names and dimension labels stay within their columns on narrow screens and in print.

The 91-file source candidate was verified against the previously tested integration manifest and the current main revision. All 24 projections, 27 Python tests, 39 JavaScript tests and static packaging passed. Focused Chrome checks repeated the three-institution comparison at desktop 1440px, mobile 390px/320px and print width; actual CSV download, generated PDF, mobile map focus restoration and the combined Europe/T11 profile filter passed. Screenshots were inspected, and no application errors were observed. [Saved browser evidence and limits](docs/verification/pr2-release/README.md).

The earlier statements that no commit/push/merge occurred describe their local preparation stage. GitHub CI and the Pages workflow establish the subsequent committed and deployed state independently. Physical touch/pinch, full screen-reader behavior, other engines and physical printing remain unverified.
