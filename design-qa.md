# International partnerships reader redesign — October 22, 2026

final result: blocked

October 23 resumption: the exact PR source was restored in a fresh environment; all 78 automated tests, formatting and packaging passed again. Cloud Chrome remained unable to reach the preview (connection refused on localhost; `ERR_BLOCKED_BY_CLIENT` on the environment host route). No final rendered screenshot or visual pass was obtained. See [the resumption record](docs/verification/pr4-resume/README.md). The earlier failed preview observations below remain historical context.

## Source of visual truth

Approved Markets option 1: institution-led briefing, grouped concise activities, small location inset and supporting developments. The selected concept is `exec-8ff303eb-b0ff-43ba-8c73-8124e46cd32a.png` from the review conversation (first displayed Markets concept). It is a design reference, not a factual geography or dataset source. The implementation follows the user's additional instruction to remove the concept's oversized headings, questions and boilerplate. Institution profiles retain the previously approved map-left/developments-right direction.

The global map uses actual Natural Earth geometry, conservative approximate anchors and one shared current-eligibility rule. New icons are official Feather assets under the existing MIT license. Polished institution text names are used because permissible official logo assets were not established; no invented marks or implied endorsement.

## Browser evidence and release gate

Intended observations: desktop 1440×900/1024, mobile 390×844, 320px and 200% zoom. The shell could not bind its preview socket. An alternative runtime reported a loopback listener, but opening its Chrome preview produced no usable observation before interruption. Browser-rendered final screenshots, console inspection, viewport measurements and source/implementation comparison were not obtained.

No full-view or focused-region comparison, real-touch validation or screen-reader pass is claimed. Earlier release screenshots are historical and cannot verify this candidate. Keep the PR draft until the real-browser journeys in VERIFICATION.md are completed. Generated concepts and jsdom output are not implementation screenshots.

## Source-review iterations

A fresh read-only reviewer identified and implementation corrected: hidden mobile List evidence; focus moving to another country after regrouping; stale selected cluster state; invisible Markets compare choices; country-scoped comparisons showing extra covered markets; missing secondary-match explanations; shifting compare slots; covered-market selection reverting to primary geography; cluster Escape handling. Dedicated regressions cover these interactions. This is code/DOM review, not a visual pass.

## Fidelity surfaces still requiring observation

| Surface | Implemented | Outstanding |
| --- | --- | --- |
| Layout | Compact top filters, 72% global map, readable activity rail, institution-led Markets, aligned comparison columns | Actual top offset, useful map height, wrapping, mobile/reflow overflow |
| Typography | Readable body and 20–24px comparison headings with existing Georgia/Arial family | Actual size hierarchy, text density and long names |
| Color/geography | Neutral teal clusters, quiet land and boundaries, persistent encoding legend | Dense-region readability, contrast, selected/focused countries |
| Assets | Actual geography and official Feather icons; institution text names | Loading, optical sizing and subdirectory paths |
| Interaction | Shared filters, URLs, accessible list, evidence dialog, clustering, expansion and keyboard paths | Browser focus, pointer/touch/pinch, accessibility tree and real device behavior |

Automated checks: 28 Python and 50 JavaScript tests pass; 24 projections agree. Formatting and static packaging are recorded in VERIFICATION.md. These are structural checks only. This source candidate has not been merged or deployed.
