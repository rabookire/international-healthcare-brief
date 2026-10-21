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

The release contains 27 Python checks and 29 JavaScript checks (five camera, 11 existing reader, six research semantics, seven DOM integration). The integration suite executes the production reader with the real inventory in jsdom. It checks controls, combined filters, result counts, map shading, URL/history, source details, focus restoration for tested controls, CSV content, country briefs, shared comparison IDs, print invocation and loading recovery. It does not render layout, capture screenshots, inspect the browser accessibility tree, simulate real touch behavior or verify actual downloads/printing.

## Required real-browser journeys

Use desktop 1440×1024 and mobile 390×844, plus 320px reflow and 200% zoom. Capture actual screenshots for each important state. No current screenshots or full interaction pass exist.

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
