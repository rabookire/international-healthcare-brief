# Verification procedure and feature map

This procedure is a release checklist. A written procedure does not establish that a journey was executed. Record actual evidence, exact snapshot/commit and remaining blockers in the release report.

| Surface | Reader job | Required observation |
| --- | --- | --- |
| Home | Understand the publication and coverage | Independence, source standard, current inventory date and links are visible; no unsupported no-news claim. |
| Map | Find management agreements in the GCC | T3 + GCC returns exactly the CSV rows satisfying both filters, including eligible shared deals. |
| Map | Inspect Vietnam across institutions | Country=Vietnam returns all and only Vietnam records; country panel lists all institutions there. |
| Map/profile | Inspect Mayo Clinic’s footprint | Institution=Mayo Clinic returns every participating record, including baseline and any shared deal. |
| Map | Find Saudi openings in the current year | Country=Saudi Arabia plus operational-year filter returns only records with evidenced operational dates in that year. Unknown dates do not qualify. |
| Map | Inspect a record | Pin/table selection reveals headline, institution, partner, status, dates, analysis and direct source. Status shape and text remain usable without color. |
| Tracker | Compare and export records | Combined filters and sort preserve CSV counts; CSV download matches canonical data. |
| Archive | Find an edition | Date, institution, region, country and tactic filters combine; an empty archive explains that no edition has been published. |
| Institution | Understand sourced activity | Map-first footprint, matching region/activity controls, right-hand recent developments, List alternative, source scope and verification dates match the tracker. |
| Methodology | Assess evidence | Full source standard, universe, inclusion/exclusion filter, six regions and the activity taxonomy are available. |

## Structural checks

```bash
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
node --test tests/test_*.mjs
python3 scripts/package_site.py
```

The generator validates taxonomy, registered institutions, IDs, country/region mappings, dates, source types, direct link structure, secondary major-item evidence metadata and projection agreement. Tests deliberately submit invalid data and prove that those boundaries reject it; they do not merely restate a rendering implementation.

## Source review

Open at least 10 seeded sources spanning institutions, regions, tactics and lifecycle states. Check every factual claim against each source, including original versus latest-event dates. Record exact IDs and outcomes. A source URL passing structural validation is not evidence that its page is reachable or its facts are correct. An old announcement alone does not prove current operation. Check all major secondary-sourced items for two independent reputable reports. Check official LinkedIn archives if any are used.

## Browser journey

Serve the static tree through the supported preview. Inspect desktop and a narrow mobile portrait layout. Exercise every row in the feature map, combinations of all filters, reset, empty result, source click, malformed URL state, back/forward navigation, sorting, and keyboard focus. Check that map pins do not hide overlapping records and that all essential details are reachable without hover or color perception. Check baseline/new controls with suspended and closed records. Reopen a shared view URL and confirm the same selection.

If a data request fails, the reader should see a meaningful error and retry route; it must not look like a legitimate zero-record result. Inspect horizontal overflow and touch target spacing on mobile. Verify that all shipped assets are local except user-activated source links; the publication must not add tracking or require login.

## Deployment

A passing local build is distinct from a successful Pages deployment. Record the Actions/deployment result and returned URL. Test the deployed site’s subdirectory-relative asset and data paths, especially `/international-healthcare-brief/map/`, profiles and archive links. Do not call an anticipated URL live until that deployment exists. If publication is unavailable, deliver the reviewed repository package and state the missing capability.

## Current execution record

2026-10-20: 24 Python tests and 10 Node tests passed, as did projection equality, JavaScript syntax and public staging checks. Independent review found no new blocking finding in the twelve-month changes.

GitHub Actions run [39507846953](https://github.com/rabookire/international-healthcare-brief/actions/runs/39507846953) passed validation and deployment for source commit `2753cd16afb59adccdb373f90387b9dc6e91a2f7`. The deployment returned https://rabookire.github.io/international-healthcare-brief/ and that page was opened successfully. All following observations are from the deployed reader, not a mock:

| Live DOM observation | Observed result |
| --- | --- |
| Overview and unfiltered map | 19 institutions, 98 records, 38 countries; 98 accessible record pins |
| History tracker `footprint=new` | 14 table rows; Alameda displays January 2026 with day not disclosed |
| Vietnam map URL | 2 records; country panel includes Johns Hopkins and Penn |
| GCC + T3 URL | 0 records with an explicit empty state |
| UCLA + China + T7 + Baseline + baseline footprint URL | 4 records; primary and secondary tactics both match |
| Saudi Arabia + operational year 2026 URL | 0 records; no unknown date treated as an opening |
| Mayo map URL | 21 records |
| Institution index and Dana-Farber profile | 19 profile cards; Dana-Farber has 5 records in 5 countries |
| Alameda deep-linked record dialog | Announced; exact announcement/operational dates unstated; month-only latest event; secondary source and evidence limits visible |
| Brief archive | No edition published yet; no fabricated no-news or backdated edition |
| Methodology | Full standard and 19-name Tier 1 list, including Dana-Farber, load under the Pages subdirectory |

The managed preview initially failed to mount `/proc`. Live DOM reads and navigation subsequently worked, but browser credential protection blocked click/select actions and screenshot observations. The documented fresh-tab recovery did not remove the restriction. No screenshot was produced. Sorting, exports, reset, click-driven filters, back/forward behavior, keyboard focus, touch and desktop/mobile visual layout are not verified. No full interaction journey is claimed; the procedure remains a draft. These are browser-environment limitations, not proven application failures. See BUILD-STATUS.md and SOURCE-AUDIT.md.

## Option 3 redesign — 2026-10-20

The review branch replaces the overview/map with the selected split workspace, preserves the canonical facts, and adds camera/ownership regression checks. The current redesigned source passes **24 Python + 16 Node tests**, projection equality, syntax and staging. Independent code review findings and repairs are in [design-qa.md](./design-qa.md).

The managed preview now starts successfully using the supplied `npm run dev` command. Cloud browser creation still fails with the native credential-state error, including after reset. No browser-rendered screenshot, visual comparison, primary interaction, console or mobile check is claimed for the redesign. The Product Design result is blocked. Existing execution evidence above describes the earlier deployed layout, not the redesigned branch.

## Institution profile draft — 2026-10-22

24 Python and 21 Node tests pass; all 24 projections agree. New tests cover insurer classification, retained secondary consulting, region migration and legacy links, combined profile filters, view URL state, sourced recent dates, empty results, list source access and secondary-activity discoverability. Packaging includes both new profile assets.

Browser execution remains blocked: local socket binding is denied and Browser Use rejects file URLs. No rendered screenshot, console inspection, desktop/mobile interaction or live deployment is claimed for this change. See the latest section of design-qa.md.

Before publication test Cleveland Clinic with Americas + Insurer Partnership (one record), Europe + Insurer Partnership (one record), and Africa + Insurer Partnership (zero with Clear filters). Switch between Map and List, open source/details, and verify reload/back/forward. Verify UPMC's secondary Joint venture filter, Mayo's Remote care filter, and a zero-record institution. Compare desktop and mobile layouts with the selected concept and inspect the long filter labels and map legend.
