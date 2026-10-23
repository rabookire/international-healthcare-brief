# Reader 2026-10-22.2 verification

Prepared against main `564d5880151228c0a145d74d99bde95d4c90a362`. Source inventory date: October 22, 2026. This record concerns the current source candidate, not a deployed release. Earlier verification remains available in Git history and `docs/verification/pr2-release/`; it does not verify this redesign.

## Executed automated checks

```bash
npm ci --ignore-scripts
python3 scripts/generate.py
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
npm test
npm run format:check
python3 scripts/package_site.py
```

The candidate has 24 deterministic projections, 28 passing Python tests and 50 passing JavaScript tests. Node tests execute the actual reader modules and inventory with jsdom; camera tests exercise clustering/camera math. They cover current-view eligibility, legacy URLs, combined and secondary filters, served markets, mobile evidence routing, cluster focus/selection, history, compare selectors and scope, shared IDs, empty states, exports and fetch recovery. Python checks validate editorial boundaries, coverage metadata, date precision, generated agreement and packaging. Formatting and static packaging are checked separately. These checks have no browser layout, accessibility tree, real touch engine or visual output.

## Real-browser gate — outstanding

The local shell HTTP server could not bind in this environment. A separate runtime reported a loopback listener, but opening its Chrome preview did not return a usable browser observation and was interrupted. No final implementation screenshots or console capture were obtained. Do not reuse earlier screenshots as proof of this revision; `design-qa.md` remains `final result: blocked`.

Use 1440×900 and 1440×1024 desktop, 390×844 mobile, 320px reflow and 200% zoom. Record the exact candidate SHA and inspect actual screenshots.

| Journey | Required observation |
| --- | --- |
| Fresh Explore | Map/activity start within 180 CSS pixels of top at desktop; map occupies roughly 70–75% width and at least 60% viewport height at 900px; compact filters, no hero/inventory boilerplate, legend visible. |
| Dense Europe/GCC/East Asia and islands | Boundaries readable, no displacement lines; cluster zoom/list exposes all members, served markets distinguished from physical offices. |
| Map camera and keyboard | Pan, zoom/reset, arrows, cluster open/close, Escape, expansion/background inertness and focus restoration work; focus stays at intended location after regrouping. Verify real touch/pinch separately. |
| Filter/history | Institution + country/region + primary/secondary tactic, search, clear, reload and back/forward agree across pages; old status/history URLs never bypass current eligibility. |
| Evidence on mobile List and Map | Details remain visible; close restores visible focus; primary sources open correctly. Announced/Unknown deep links explain their exclusion; history remains intact. |
| Planned facility | An active advisory relationship retains its planned-facility caveat and never appears as an open hospital. |
| Compare | Choose two, optional third, change/remove, reject duplicates/fourth, preserve empty slot, scope to Cayman or another market, evidence drilldown and zero-result recovery. Verify mobile contained scrolling without page-wide overflow. |
| Markets | Choose dense/sparse country; immediately identify hospitals/tactics; select up to three for scoped comparison. Filtering removes hidden choices. |
| Institution | Map-first desktop with developments right; region/type controls, secondary-match explanation, List, empty cohort profile and add-to-comparison. |
| Accessibility/reflow | Visible focus, labels, icons, contrast, long names, 320px, 200% zoom, reduced motion, console/fetch errors and screen-reader output. |
| Data/export/package | CSV retains evidence, covered markets, dates and metadata; record totals are unique IDs. Verify source links and GitHub Pages subdirectory assets without deployment. |

## Editorial reconciliation

The source review retains all 98 original IDs and date histories, adds 12 unique relationships, reconciles 41 Unknown statuses using explicit current services/Active Projects, and retains 29 unresolved Unknown records outside current views. See the per-ID [log](docs/research/reconciliation-2026-10-22.md) and machine-readable companion. Nine Mayo detail fetches timed out; those rows cite the explicit current official country directory, with the limitation disclosed. Structural tests cannot independently establish factual entailment. No completed recurring scan, historical edition or broader institution cohort is claimed.

## Publication

Keep the PR draft until the browser gate is completed and findings resolved. This task stops at a reviewable draft PR. It does not authorize merge or deployment. A later publication requires the exact merged SHA, successful Pages run, returned deployment URL and critical live journeys.
