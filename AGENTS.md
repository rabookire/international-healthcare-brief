# Project instructions

Read METHODOLOGY.md and RUNBOOK.md before editing facts or editorial behavior. The CSV is canonical; never hand-edit generated projections to fix disagreements. Preserve stable Record IDs, dated corrections and exits. Shared agreements involving several tracked institutions remain one record.

Use only public directly linked sources. Distinguish source facts, analysis and cartographic approximations. Baseline is a seeding label, not an operating-status claim. Do not fabricate an edition or imply a scan was completed when it was not. Never publish private institutional knowledge, personal data, secrets, institution logos, or implied endorsements.

After data changes run `python3 scripts/generate.py`, `python3 scripts/generate.py --check` and `python3 -m unittest discover -s tests -v`. For UI changes, also execute affected browser journeys in VERIFICATION.md at desktop and mobile widths. Check all combined filters and keyboard/touch alternatives. Keep runtime and live deployment evidence separate.

The release date is explicit in data/release.json. Confirm the exact deployed commit and returned Pages URL before reporting the publication live. Preserve unrelated changes. Do not create a recurring agent or send external messages without the user’s authorization.
