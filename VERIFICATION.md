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
| Institution | Understand sourced activity | Footprint, map slice, timeline, source scope, sources and last verification match the tracker. |
| Methodology | Assess evidence | Full source standard, universe, inclusion/exclusion filter, five regions and nine tactics are available. |

## Structural checks

```bash
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
node --test tests/test_reader.mjs
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

2026-10-20: 24 Python tests and 10 Node tests passed, as did projection equality, JavaScript syntax and public staging checks. The supported preview failed before startup because its sandbox could not mount `/proc`; no browser journey or screenshot is claimed. The procedure remains a draft pending an actual complete journey. See BUILD-STATUS.md and SOURCE-AUDIT.md.
