# Reader release 2026-10-21.1

Status: implemented and prepared for review; publication awaits real-browser verification.

Base: `f0f790747dc6969c99423c552391dc571cf74e27`, the merged research-desk reader. The live main release and this prepared branch are separate deployment states.

Implemented: independent lifecycle/history, source-supported normalization of 14 baseline relationships, explicit Unknown for 70 others, planned-facility scope, revised research/inbound policy, six geography groups, clearer activity summaries, focus lenses and filter chips, filtered country shading, evidence-preserving export, mobile List/Map controls, country briefs, institution comparison, printable citations, coverage page, demoted empty brief archive, source-independent methodology loading, source formatting and development-only DOM integration tests.

Source inventory: 98 records, 38 countries, records for 14 of 19 listed institutions. All record IDs, source verification dates and initial/historical classifications remain intact. The checked source inventory date is October 20, 2026. Reader changes do not represent a new source scan or new editorial edition.

Automated validation: 24 generated projections; 27 Python and 29 Node checks, including seven DOM integration journeys. See VERIFICATION.md for commands and limits. Local success must be confirmed for the exact committed revision; CI supplies its own result.

Open release gate: browser tools were not exposed in the working session. No new desktop/mobile screenshot, touch check, visual verdict or live publication is claimed. The repository instructions require those journeys for UI changes. Save as a draft PR until they can be completed.

Research partnership and non-U.S. competitor seeding are ongoing editorial work, not completed coverage in this release. No project-wide code/data license was selected implicitly.
