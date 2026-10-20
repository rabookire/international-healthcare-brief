# International Healthcare Brief

Independent intelligence on US hospitals’ international businesses, for business-development leaders and strategists at major US academic medical centers.

Follow overseas facilities, operating partnerships, management and consulting agreements, in-country offices, patient channels and named-market care services. Each published fact links to a public source. Analysis is labeled. Not investment or business advice. No affiliation or endorsement is implied.

- [Live publication](https://rabookire.github.io/international-healthcare-brief/) · [Live map](https://rabookire.github.io/international-healthcare-brief/map/) · [12-month historical activity](https://rabookire.github.io/international-healthcare-brief/data/?footprint=new)
- [Publication home source](./index.html)
- [Latest brief and searchable archive](./briefs/index.html) — editions appear only after a completed scan identifies material news; historical seeding does not create backdated briefs.
- [Interactive global map](./map/index.html)
- [Sortable, filterable permanent tracker](./data/index.html) · [CSV](./data/tracker.csv) · [Markdown view](./data/tracker.md)
- [Tier 1 institution profiles](./institutions/index.html) — 19 institutions, including Dana-Farber Cancer Institute.
- [Methodology](./METHODOLOGY.md) · [Production runbook](./RUNBOOK.md) · [Seed counts and coverage gaps](./SEED-REPORT.md)

## Current build status

The initial inventory contains **98 records: 84 baseline and 14 historical backfill, across 38 countries**. Coverage is partial; 14 of 19 Tier 1 institutions have seeded records. The reader and editorial tooling are implemented, with 34 passing automated checks. The same-standard historical window is October 20, 2025–October 19, 2026. GitHub Pages is live; the source and deployment passed the 34 automated checks. Live DOM checks confirmed page rendering, URL-filtered counts and source detail rendering. Click-based, visual, download, keyboard and mobile QA remain incomplete because browser credential protection blocked interactions and screenshots. Exhaustive seeding also remains incomplete. See [BUILD-STATUS.md](./BUILD-STATUS.md) and [SOURCE-AUDIT.md](./SOURCE-AUDIT.md) for evidence and limits.

## Sourcing standard — non-negotiable

1. **Primary sources first:** the tracked institution's newsroom/press release; the foreign partner's official announcement; a government/ministry/embassy/regulator announcement.
2. **Reputable secondary only when no primary exists, flagged as secondary:** Becker's Hospital Review, Modern Healthcare, Fierce Healthcare, Reuters, Bloomberg, AP, STAT, established regional outlets of record.
3. **LinkedIn rule:** a post on an institution's **official, verified LinkedIn company page** counts as primary when it states substantive facts (partner, country, nature of the deal); archive the post's date and full text in the record (posts can be edited/deleted) and upgrade the link when a press release appears. **Individual employees' posts — including CEOs and international presidents — are never sources**; they are tips only.
4. **Never acceptable:** aggregators, content farms, PR-syndication mirrors, Wikipedia, personal social posts, blogs, unidentifiable outlets.
5. **Every factual claim traces to the linked source.** Figures (deal value, beds, volumes, timelines) appear only if in a linked source. Direct links to the specific article/release, never homepages.
6. **Announced ≠ operational.** Wording follows exactly what the source proves (MOU/intent vs signed vs under construction vs open).
7. **Major items** (openings, JVs, management contracts, exits) require a primary source or two independent reputable sources.
8. **Corrections** are made in place with a dated correction note in the item and a tracker change-log entry. Nothing is silently edited.

## Read and run locally

The site is static HTML, CSS and JavaScript. It has no backend, account, tracking, API key or runtime build requirement. Serve this directory with any static web server; for example:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Opening HTML directly through a `file:` URL can prevent browsers from loading JSON; use an HTTP server.

The CSV is canonical. After editing it and its evidence/coverage notes:

```bash
python3 scripts/generate.py
python3 scripts/generate.py --check
python3 -m unittest discover -s tests -v
node --test tests/test_reader.mjs
```

See [scripts/README.md](./scripts/README.md) for the exact schema, edition metadata and reproducible commands. See [VERIFICATION.md](./VERIFICATION.md) for reader journeys and release checks. Generated dates are explicit editorial inventory dates, never machine-clock guesses.

## Publish on GitHub Pages

The included Pages workflow validates generated outputs and tests before deploying a static artifact on a push to `main`. The repository and live Pages URL must be confirmed after deployment; an expected URL is not evidence of publication.

For a new repository, run from this directory with an authenticated GitHub CLI:

```bash
git init -b main
git add .
git commit -m "Build International Healthcare Brief"
gh repo create international-healthcare-brief --public --source=. --remote=origin --push
gh api --method POST repos/{owner}/international-healthcare-brief/pages -f build_type=workflow
gh workflow run pages.yml
```

If the repository already exists, add its remote and push the reviewed source rather than creating a duplicate. If Pages already exists, preserve its settings and use the configured deployment workflow. Confirm the Actions run and returned Pages URL, then exercise the live map and source links. Repository creation and Pages administration require capabilities beyond content-only GitHub access.
