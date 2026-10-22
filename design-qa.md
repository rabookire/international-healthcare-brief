# Institution profile redesign — October 22, 2026

final result: blocked

## Selected direction

The user selected option 1 from the second design set: a dominant map on the left, recent developments on the right, and matching closed Region and Activity type controls. The selected corrected visual is `exec-60e8c228-8cfd-40a3-92cc-77d8893eee25.png`, inspected at 1488 × 1056. Subsequent user instructions add a distinct Insurer Partnership category, use In-Country Representative for hospital-listed representatives/offices, and split Africa from Middle East outside the GCC.

The concept map is a design reference, not a geographic or factual source. The implementation retains Natural Earth geometry, canonical records and approximate locators. It uses the existing local icon library. No institution logos, illustrative map pins or unsupported facts were copied from the concept.

## Runtime evidence and release gate

- Intended viewports: 1440 × 1024 desktop and 390 × 844 mobile. No implementation viewport or screenshot was observed.
- Local HTTP server startup failed with `PermissionError: [Errno 1] Operation not permitted` on socket bind. The managed cloud-preview command is unavailable in this desktop environment.
- A separate file-based preview was prepared, but Browser Use rejected the `file:` URL because only HTTP/HTTPS protocols are allowed. No alternate browser surface or security workaround was attempted.
- Browser-rendered implementation screenshot: **unavailable**.
- Primary browser interactions tested: **none**. DOM template and filtering unit tests are not browser journeys.
- Browser console inspection: **unavailable**.
- Full-view and focused-region source/implementation comparison: **not performed**.
- Product Design visual QA and the project AGENTS.md desktop/mobile gate remain **blocked**. This change is a draft, not a claim of publication or a completed visual handoff.

## Required fidelity surfaces

| Surface | Implemented | Remaining observation |
| --- | --- | --- |
| Typography | Existing Georgia headings, Arial controls; larger institution title and compact right-hand headlines | Wrapping, density and legibility at both viewports |
| Layout and spacing | Map-first two-column desktop; three recent developments; paired filters; mobile stack with full-width controls below 480px | Actual map proportions, sidebar length, footer overlap and horizontal overflow |
| Colors | Existing navy/teal palette, quiet gray geography; amber diamond for insurer partnerships | Rendered contrast and distinction at small marker sizes |
| Assets | Real geography, existing local icons, analytic activity symbols | Marker overlap, labels, icon loading and map camera behavior |
| Content | Counts moved below the map; source links and evidence details retained; dated updates separated from undated baseline | Actual reading order, source navigation and empty states |
| Interaction/accessibility | Native selects, keyboard-accessible record pins, Map/List, clear filters, URL state, existing modal | Keyboard focus, touch/pinch, zoom/reset, browser back/forward and screen-reader announcements |

## Source-review fixes

A fresh read-only review found and verified fixes for:

1. Profile map controls inherited a vertical global layout. Profile CSS now explicitly uses a horizontal row and removes the inherited reset-button margin.
2. The activity dropdown initially omitted secondary tactics. It now includes them, while the legend describes only the primary symbols actually drawn. Regression coverage includes UPMC joint ventures and Mayo remote care.

These are source-review iterations, not visual-QA iterations. The focused re-review found no remaining concrete source issue.

## Automated evidence

- 24 Python tests and 21 Node tests pass.
- All 24 generated projections agree with the canonical CSV.
- Insurer Partnership uses T11, avoiding the T10 research category already introduced in pending PR #2.
- Allshores, Bupa and Bermuda Life/Argus are classified as insurer partnerships; the Johns Hopkins consulting service remains T4 secondary.
- Four former Other records move to Africa or Middle East (non-GCC). Legacy Other links retain the union view.
- All 98 stable IDs, source facts, source dates, source-verification dates and 84 baseline/14 historical classifications are preserved.
- JavaScript syntax and public static asset staging pass.

## Before merging

Open the HTTP preview in an authorized browser and compare the Cleveland Clinic profile to the selected visual at desktop size and a narrow viewport. Exercise both filters individually and together, insurer-only results, Map/List, empty-result recovery, marker/detail/source access, camera controls, keyboard/touch alternatives, URL reload and back/forward. Inspect an institution with secondary activities and an institution with no seeded records. Check console errors and subdirectory-relative assets. Fix observed issues and repeat screenshots before changing the result to passed.

PR #2 also changes shared reader and taxonomy code. Reconcile the two branches before releasing them together; retain its research category and status improvements. This draft is based on the current live main branch and does not overwrite that separate work.

---

# Earlier design QA record (preserved history)

# Option 3 — Research Desk design QA

final result: blocked

## Comparison target and evidence

- Source visual truth: selected third displayed generated image, `/workspace/scratch/f259a949f48a/generated_images/exec-abff952e-68f4-4715-bfe7-512b97c4d9cb.png` (1488 × 1056 raster). The source was opened and inspected before implementation. It is an illustrative concept, not a dataset or factual map.
- Intended desktop viewport: 1440 × 1024 CSS pixels. Intended narrow viewport: 390 × 844 CSS pixels. Implementation CSS size, pixel dimensions and device density have not been observed.
- Comparison state: `/map/?institution=Dana-Farber%20Cancer%20Institute&record=IHB-0080`.
- Implementation screenshot: unavailable. No source/implementation full-view comparison or focused-region comparison was possible; no normalization or visual-fidelity verdict is claimed.
- The supported preview starts at its managed address using `npm run dev` and the dependency-free static server. Starting the service is not browser verification.
- Cloud browser creation failed after a runtime reset with: `Browser observation is unavailable because native credential state cannot be safely resumed. Start a new browser runtime to continue.` Previous native-credential-state failures affected this conversation too. The user explicitly authorized proceeding from existing code.

## Findings

- **Verification blocker:** browser-rendered desktop/mobile screenshots, actual interactions, console inspection and design comparison remain unavailable. The selected source image alone cannot prove the implementation matches. Do not call this redesign visually verified or merge it as a completed Product Design handoff.

## Required fidelity surfaces

| Surface | Implemented from reference/code | Verification status |
| --- | --- | --- |
| Fonts and typography | Local Georgia editorial headings; Arial/Helvetica interface, larger controls and list text | Browser wrapping, density and readability unverified |
| Spacing/layout rhythm | Compact dark navigation, short toolbar, left list/right map, mobile map-first stack and fixed detail sheet | Rendered proportions, overflow and spacing unverified |
| Colors/tokens | Navy, teal, gray-green and white from existing palette | Rendered contrast and fidelity unverified |
| Asset fidelity | Existing Natural Earth data geometry, source-backed map locators and locally vendored Feather controls | Browser map/icon rendering unverified; no raster map substituted |
| Copy/content | Removed hero/repeated instructional text, concise rows, collapsed evidence/legend, persistent coverage link | Code reviewed; visual truncation and legibility unverified |

## Independent source-review history

Review identified and implementation corrected these issues before the draft was saved:

1. Country summaries could hide actual institutions under an active institution filter. `activityDisplay` preserves ownership in all-country rows; regression test covers Mayo + Vietnam.
2. Mobile list selections could show details above the viewport. Small-screen details now use a fixed bottom sheet; code also moves keyboard focus to the detail surface.
3. A newly selected activity could remain outside the panned viewport. Camera reveal preserves the reader's zoom; covered by a regression test.
4. Expanded-map background controls remained focusable. Covered surfaces and Skip link become inert, Tab is contained, collapse restores focus, and closing selection returns to the selected map pin.
5. CI omitted camera tests. CI now executes every `tests/test_*.mjs` suite.
6. A historical-only label covered future dated updates. The filter now says “Dated activity.”
7. Natural Earth's “The Bahamas” now resolves to canonical “Bahamas.”

The final independent source re-review found no further concrete source blocker. These are code-review iterations, not visual-QA iterations. No fabricated screenshot or visual pass is recorded.

## Automated checks

- 24 Python tests and 16 Node tests pass (40 total).
- Canonical dataset and 24 generated projections unchanged: 98 records, 84 baseline, 14 historical, 38 countries.
- Camera tests cover anchored zoom, bounds, fit at desktop/portrait aspect ratios, coincident pin separation and offscreen selection.
- Existing combined filters, URL state, CSV export escaping, source Markdown safety and shared-record membership tests pass.
- JavaScript syntax and public asset staging pass.

## Implementation checklist before publication

1. Restore a usable cloud browser session and open the managed preview.
2. Capture the same Dana-Farber selection at desktop size and compare with the selected source in one comparison input; inspect focused typography/filter/detail crops too.
3. Exercise combined filters, multi-select, reset, back/forward, selection, source links, CSV download, pan, wheel zoom, pinch, keyboard map controls, expanded view and focus restoration.
4. Inspect 390px mobile layout, fixed details sheet, touch targets and overflow.
5. Check loading/empty/error behavior and browser console errors.
6. Fix any P0/P1/P2 finding and repeat capture/comparison. Only then set `final result: passed` and publish.
