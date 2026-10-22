# International Healthcare Brief

Public-source intelligence on U.S. health systems’ international facilities, partnerships and patient-access channels, for AMC international-program leaders and hospital consultants.

[Live publication — current main release](https://rabookire.github.io/international-healthcare-brief/) · [Methodology](./METHODOLOGY.md) · [Release verification](./VERIFICATION.md)

## Prepared reader release: 2026-10-21.1

This branch prepares a research workflow release. It is not a claim that the new routes are deployed. Automated checks cover editorial boundaries, reader logic, DOM integration and static packaging. Local desktop/mobile interaction checks and screenshots are recorded in [release verification](./docs/verification/pr2-release/README.md); CI and deployment establish their own results for the exact committed revision. See [BUILD-STATUS.md](./BUILD-STATUS.md).

The source inventory remains **98 records across 38 countries**, with records for **14 of 19 listed institutions**, checked as of October 20, 2026. Its 84 initial-inventory and 14 historical records retain their IDs and source dates. Lifecycle is independent of that history: 21 relationships are active/operational, 70 have status not established, six are announced and one is in development. These counts describe this partial inventory, not market share or patient volumes.

## Useful research tasks

- Find documented activity by institution, country, lifecycle, specific activity or focus lens. Every result shows the event, relevant date, role category and source context.
- Read a country brief with participating institutions, relationship models, recent recorded developments and printable citations.
- Compare two or three institutions across the same filters. Shared agreements retain one ID and are exported once.
- Inspect planned-facility caveats separately from active advisory work. Unknown status never means inactive.
- Export the selected records with evidence scope, direct and additional sources, date precision, dataset hash, reader version and query context.

The mobile interface has an explicit List/Map switch and starts with the list. The table remains an equivalent research view. Desktop/mobile rendering, touch behavior and assistive-technology output still need real-browser verification; jsdom has no layout or visual output. Genuine screenshots will be added after that verification.

## How it is built

The production site is static HTML, CSS and native JavaScript modules. It needs no backend, account, tracking, API key or production build. A canonical CSV and evidence sidecars feed deterministic Python projections. Shared IDs prevent duplicated agreements; URL state makes filtered views reproducible.

- `assets/core.mjs`: filtering, URL state, escaping, Markdown and evidence-preserving CSV.
- `assets/research.mjs`: reader vocabulary, focus lenses, coverage and comparison summaries.
- `assets/record-view.mjs`: shared source/evidence presentation.
- `assets/pages.mjs`: country, comparison, coverage and printable research views.
- `assets/app.mjs`: navigation, DOM events, map and page orchestration.
- `scripts/generate.py`: editorial validation and reproducible JSON/Markdown projections.

Node dependencies are development-only: jsdom runs integration tests, and Prettier formats source. GitHub Actions checks the data, tests the reader, stages allowed static files and deploys main through GitHub Pages.

## Run and verify

```bash
npm ci --ignore-scripts
python3 scripts/dev_server.py
```

Open the local address printed by the server. Use an HTTP server rather than opening HTML through a file URL.

```bash
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
npm test
python3 scripts/package_site.py
```

After editing the canonical CSV or evidence, run `python3 scripts/generate.py` and repeat the checks. See [the data contract](./scripts/README.md), [editorial runbook](./RUNBOOK.md) and [browser journeys](./VERIFICATION.md).

## Scope and limits

Primary sources are preferred; facts and analysis are separate. Dates remain unknown when a source does not establish them. Announced relationships are not operating facilities. Map locations are city/country approximations. Shared or multi-category activity is not an additive measure of scale.

The tracked universe currently focuses on U.S. institutions. It is not a complete global competitor map. Research partnerships are eligible under the revised policy, but their systematic review is pending. Missing records must not be read as no activity. No editorial edition or completed monitoring scan is fabricated.

Report a correction through the [sourced correction template](https://github.com/rabookire/international-healthcare-brief/issues/new?template=correction.yml). Include a record ID and direct public source; do not submit private institutional information.

## Next evidence work

Complete real-browser release checks, then expand research coverage and deliberately curate non-U.S. competitor coverage. Add specialties, financial terms, ownership roles and agreement duration only where sources establish them. Keep undisclosed, unreviewed and inapplicable facts distinguishable.

## Licensing and attribution

No project-wide code/data license has been selected. Linking an external source does not grant rights to its contents. Natural Earth map data and the vendored Feather icons retain their documented attributions and terms in `assets/MAP-SOURCES.md` and `assets/icons/LICENSE.txt`. Institution names are text references and imply no endorsement.

## Combined local reader integration

The local integration of the research workflows and map-first institution profiles keeps T10 Research partnership and T11 Insurer Partnership distinct. Profiles open on their interactive map; the global mobile explorer opens in List. Explicit view links preserve their selection. Middle East (non-GCC) is canonical, while older Middle East and Other links remain usable. See VERIFICATION.md for the exact source revisions, executed local checks and remaining release limits. Source inventory and source-verification dates remain October 20, 2026; this integration does not claim a new scan or publication.
