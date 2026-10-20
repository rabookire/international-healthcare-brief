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
