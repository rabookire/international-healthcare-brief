# Methodology

International Healthcare Brief is an independent publication for U.S. academic medical center international-program leaders and consultants advising hospitals on international relationships. The tracked universe is an editorial selection based only on public information. Institution names are text references; they imply no endorsement. Analysis is labeled and is not investment or business advice.

The needle test governs every decision: publish nothing that would not move the needle for a business-development leader at a major US international hospital program. Borderline candidates are held, not padded into an edition.

## Tracked universe

**Primary tracked set (19):** Cleveland Clinic · Mayo Clinic · Johns Hopkins Medicine International · MD Anderson Cancer Center · Memorial Sloan Kettering · Mass General Brigham · Houston Methodist · UPMC · Boston Children's Hospital · Cincinnati Children's · Children's Hospital of Philadelphia · Texas Children's Hospital · Stanford Medicine · UCLA Health · NewYork-Presbyterian · NYU Langone Health · Cedars-Sinai · Penn Medicine · Dana-Farber Cancer Institute.

**Extended tracked set:** other U.S. hospitals with material international programs may be registered after editorial review. The registry describes research scope, not a promise of completed daily or weekly monitoring.

**Non-U.S. institutions** currently appear as partners/counterparties or qualifying Market Signal subjects. A separate global-competitor inventory has not been completed. The current map must not be interpreted as a complete competitive landscape.

Research partnerships became eligible under the policy revision of October 21, 2026. Systematic research coverage has not yet been completed. Earlier exclusions and coverage notes are retained as dated research history; they do not establish an absence of research activity. See [Coverage and gaps](coverage/).

## 4. Editorial rules — what counts (the calibrated filter)

### 4.1 In scope
- Strategic partnerships/affiliations and joint ventures with foreign institutions
- Owned/operated facilities abroad (announcement, groundbreaking, opening, material capital expansion)
- Management contracts and consulting/advisory agreements abroad
- In-country offices, representative offices, named in-country BD presence
- Inbound international patient developments: new services, dedicated units, government/embassy payer agreements and named foreign referral channels. A U.S.-based treatment program qualifies when the activity explicitly concerns a named foreign market, payer, government or cross-border service pathway. Representation does not prove patient flows.
- **Payer and insurer partnerships:** agreements with major international health insurers — in-market payer deals at a tracked institution's foreign facility, insurer network/referral/value-based partnerships
- Telemedicine / remote second opinion launches or expansions **into a named foreign country** (a care service delivered into a market)
- Education/training bundled into a clinical, advisory or research partnership, or a named institutional workforce build with substantive commitments. Routine individual fellowships remain excluded.
- Leadership moves into/out of **international-specific** senior roles (international arm president/CEO, regional president abroad, chief of global/international services, president of a foreign facility)
- Material changes to existing footprint: expansion, renewal, restructuring, suspension, **exit/closure** (exits are news — record them, never silently delete)
- A tracked institution's **commercial arm** (laboratories, diagnostics) expanding into named foreign markets via investment/acquisition
- Material institution-level research agreements, funded joint research programs, named research centers or infrastructure, and trial networks with specific international institutional commitments. A care-delivery or facility component is not required for these research records. Ordinary individual papers, trials and academic visits remain excluded.

### 4.2 Market Signals (second-tier section; never lead the brief)
- Major hospital PPPs/tenders in covered regions — **from tender/EOI stage**, not only at award; major operator awards
- Material expansion by major non-US operators inside covered regions (multi-facility programs, cross-border market entries)
- Payer/policy developments in major patient-source countries **only if** they plausibly channel patients to, or compete for the same patients as, major US programs
- A signal qualifies only if it bears on markets where US international programs compete (US-relevance anchor) **and** meets a material-scale threshold: a single-facility opening by a local operator in its home market is routine and out; a purely domestic story inside a foreign country (local operator, local facilities, local government) is out; government agencies' own office openings/closures are out (signals are market events — operators, payers, tenders, policy).

### 4.3 Out of scope
- Individual research papers, routine standalone clinical trials and academic visits without a material institution-level partnership or program
- Standalone data-sharing, AI/platform or data-network announcements without a substantive institutional clinical or research commitment
- Consortium/alliance/network memberships with no specific operational commitment
- Standalone scholars/fellowship/training-program announcements
- Standalone donations, charitable missions or technical-assistance announcements without a qualifying institutional clinical, advisory, research or workforce partnership
- Conferences, awards, rankings, accreditations, designations (a substantive strategy profile/interview with a Tier 1 international arm's leadership is the narrow exception — in)
- Domestic U.S. activity without a substantive named international relationship or patient-access pathway; system-wide leadership changes that are not international-specific. The explicit inbound-patient rule above takes precedence for qualifying U.S.-based international programs.
- Promotional releases with no concrete event (no deal, opening, agreement, or appointment)
- Routine staffing news at foreign facilities (e.g., adding one physician)

### 4.4 Decision procedure for every candidate item
1. Is a Tier 1/Tier 2 institution (or a §4.2 signal) the actor? 2. Does it match §4.1/§4.2 and avoid §4.3? 3. Does it pass the needle test (§1)? 4. Can it be sourced to §6 standard? Fail any step → exclude. Borderline → hold, do not publish.

## 5. Taxonomy and data model

**Regions:** GCC (Saudi Arabia, UAE, Qatar, Kuwait, Oman, Bahrain) · Americas · Asia Pacific · Europe (including Turkey) · Middle East (non-GCC, including the Caucasus) · Africa. The former Other group is split into Middle East and Africa; old Other links retain that combined view. Country denotes the documented foreign activity or named patient-source market. Multi-country relationships retain country-level records where the commitment is country-specific, with shared agreements identified. The grouping is an editorial navigation aid.

**Tactics (tag by substance, not headline; primary + optional secondary):** T1 Owned/operated facility · T2 Joint venture · T3 Management contract · T4 Consulting/advisory · T5 Strategic affiliation/partnership · T6 In-Country Representative · T7 Telemedicine/remote second opinion · T8 Education/training · T9 Inbound patient channel · T10 Research partnership · T11 Insurer Partnership. Tiebreak order when bundled: T1 > T2 > T3 > T11 > T4 > T6 > T5 > T10 > T8 > T7 > T9. Reader focus lenses combine relevant primary and secondary tags; a secondary match is explained in the result.

**Relationship lifecycle:** Announced · In development · Operational (displayed as Active / operational) · Suspended/restructured · Closed/exited · Unknown (displayed as Status not established). Initial-inventory history is stored independently as `seed_kind` and is not a lifecycle status. An advisory relationship may be active while its associated facility remains planned. `facility_status` separately identifies Open, Planned, Under construction, Closed, Unknown or Not applicable, using evidence only.

**One deal = one record.** Announcement → signing → opening are updates to the same Record ID (`IHB-0001`, sequential), never separate records. Status changes and updates go in the record's change log.

**Tracker columns:** Record ID · Institution · Partner/Counterparty · Country · Region · City · Tactic (primary) · Tactic (secondary) · Status · Announcement date · Operational date · Headline summary · So-what (1–2 lines, labeled analysis) · Source URL · Source type (Primary / Secondary / Official LinkedIn) · Source date · Last verified · Change log.

## 6. Sourcing standard — non-negotiable, printed on the product

1. **Primary sources first:** the tracked institution's newsroom/press release; the foreign partner's official announcement; a government/ministry/embassy/regulator announcement.
2. **Reputable secondary only when no primary exists, flagged as secondary:** Becker's Hospital Review, Modern Healthcare, Fierce Healthcare, Reuters, Bloomberg, AP, STAT, established regional outlets of record.
3. **LinkedIn rule:** a post on an institution's **official, verified LinkedIn company page** counts as primary when it states substantive facts (partner, country, nature of the deal); archive the post's date and full text in the record (posts can be edited/deleted) and upgrade the link when a press release appears. **Individual employees' posts — including CEOs and international presidents — are never sources**; they are tips only.
4. **Never acceptable:** aggregators, content farms, PR-syndication mirrors, Wikipedia, personal social posts, blogs, unidentifiable outlets.
5. **Every factual claim traces to the linked source.** Figures (deal value, beds, volumes, timelines) appear only if in a linked source. Direct links to the specific article/release, never homepages.
6. **Announced ≠ operational.** Wording follows exactly what the source proves (MOU/intent vs signed vs under construction vs open).
7. **Major items** (openings, JVs, management contracts, exits) require a primary source or two independent reputable sources.
8. **Corrections** are made in place with a dated correction note in the item and a tracker change-log entry. Nothing is silently edited.


## How to read the inventory

The historical backfill covers **2025-10-20 through 2026-10-19 inclusive**: the 12 months before launch on 2026-10-20. These historical facts must meet the same sourcing, inclusion and needle-test standards as current items. Records retain their original event dates and linked evidence; historical research does not create backdated brief editions. The launch window stays fixed as future editions are published. Older pre-existing arrangements can still appear as baseline footprint when they meet the same verification standard.

A record represents an agreement or facility relationship, not each stage of its life. A later signing, opening, renewal, ownership change or exit updates the original Record ID and change log. Original announcement and operational dates remain intact. Evidence metadata records the date of the latest substantive update when it differs from the original announcement date.

Initial inventory (`seed_kind: baseline`) means a pre-existing arrangement included during launch research. It does **not** mean operational. On October 21, 2026, lifecycle was separated from this history: 12 baseline operating-facility records and two active advisory/consultancy records were normalized using their existing verification notes; the other 70 baseline records became Unknown. This classification change did not advance source-verification dates or claim a new source review. A source-scope note and separate facility status distinguish planned arrangements from open facilities. The inventory retains suspended and closed arrangements in its history. Blank dates mean the source did not establish the date; they are never estimated from a page’s crawl time.

When a source establishes an event’s month but not its day, the inventory preserves that precision. Exact-day CSV fields remain blank; evidence records the sourced month as `YYYY-MM`, and readers see a month-only label marked “day not disclosed.” A month-only event qualifies for the historical backfill only if the entire known month falls inside its fixed window. The month is never converted into an invented first or last day. Dated historical milestones may be retained with their own summaries and direct source links.

One shared deal involving two tracked institutions remains one record. The CSV Institution cell lists those institution names separated by a semicolon; all participating institution pages and map slices include the same Record ID. Multi-country relationships use country-level records where the operational commitment is country-specific, with the shared agreement identified in the change log.

Institution counts describe the inventory, not the scale of patient volumes or investment. Pin locations are cartographic approximations for the named city or country, never a sourced street address or facility boundary. The equivalent activity list preserves every eligible current relationship and filter. Full canonical evidence retains all other records.

## Editorial evidence and technical checks

The canonical data is `data/tracker.csv`. Deterministic generators create the map dataset, reader tables, profile pages and archive. Evidence notes in `data/evidence.json` explain source scope and seeding classification; they never replace a linked public source. Reader-facing research coverage and unresolved gaps appear in [Coverage and gaps](coverage/). The generated seed report remains available in the GitHub repository as engineering/research documentation.

A structural validator checks dates, taxonomy, registered tracked institutions, stable IDs, direct HTTPS source links, overlapping deal identities and generated-file agreement. It cannot decide whether a source entails a factual claim or whether an item passes the needle test. An editor must do both.

For major secondary-sourced items, two source domains are a minimum structural check; the editor must also establish that the reporting is independent and reputable. Official LinkedIn sources require dated full-text archives and an explicit verified-company-page check. Individual posts remain tips only.

## Reuse and comparison

Filtered CSV exports retain lifecycle, facility status, initial-inventory history, source scope, source notes, direct and additional source URLs, event history, month-only precision, source-verification date, dataset hash, reader version and view filters. An export timestamp is not substituted for a source-verification date. Country briefs and comparisons keep full linked evidence one interaction away; the dedicated tracker retains scoped CSV export.

Counts describe documented records, not revenue, investment, patient volumes or competitive strength. Shared agreements keep one record ID across participating institution columns and are exported once. A broad owned/operated category does not establish the institution’s exact equity or management role; inspect the specific source.

## Classification clarification — October 22, 2026

The former Other region is split into Africa and Middle East (non-GCC). Egypt and Nigeria are in Africa; Jordan and Lebanon are in Middle East (non-GCC). GCC remains Bahrain, Kuwait, Oman, Qatar, Saudi Arabia and the United Arab Emirates. Turkey and Cyprus remain in Europe under this publication’s existing commercial-market convention. Armenia, Azerbaijan and Georgia remain with Middle East (non-GCC). These editorial market groupings are mutually exclusive; they are not a claim to reproduce the UN geoscheme. Africa includes North Africa, so Egypt is not counted twice. Existing Other links continue to show the union of the two replacement regions.

**In-Country Representative (T6)** means a hospital-listed local representative, patient liaison or representative office that helps patients access the hospital, including its US locations. A listing on the hospital’s official website qualifies; separate proof of payroll status is not required. This label does not imply a care-delivery facility. Insurer agreements alone do not qualify as representation.

**Insurer Partnership (T11)** identifies a documented agreement with a health insurer, such as a covered-provider network, referral arrangement, value-based care program or insurer-sponsored population-health program. It is separate from general strategic partnerships (T5) and local representatives (T6). An office helping with insurance paperwork does not qualify without a sourced insurer agreement. For an insurer agreement, retain consulting (T4), inbound patient channels (T9), or other supported activities as secondary tags. Ownership, joint ventures and management contracts remain higher-priority primary activities. The Allshores, Bupa and Bermuda Life/Argus records are reclassified without changing their source facts or verification dates.


## Current reader scope — 2026-10-22.2

Explore, institution profiles/directories, Markets, Compare and the tracker display only relationships whose canonical lifecycle is Operational. The same predicate governs counts, map clusters and recent developments. Status/history controls and repeated lifecycle badges are removed from those primary workflows; this is a presentation scope, not deletion of canonical history. Direct links to non-current records retain full evidence with an exclusion notice. No inactive browsing section is introduced. Unknown still means current status was not established, never that the institution is inactive.

Current official directories that explicitly offer continuing assistance and explicit Active Projects listings can support a narrowly scoped Operational determination after exact source review. Page availability, an old announcement, a signed MOU or no known closure alone cannot. Retain the claim, exact source, checked date and limitations in evidence and the change log. Active advisory work may concern a planned hospital; it remains advisory rather than an operating facility.

Optional `covered_countries` metadata makes a single multi-market representative relationship discoverable in every explicitly sourced market while preserving one global Record ID. It does not create staffed offices, additional agreements or sourced street locations. A `representative_location_note` explains that limit. Country-scoped comparisons report only the selected market. Map clusters count unique relationship IDs within the cluster; a relationship may appear at multiple documented served-market locators, so adding map labels is not a global unique count.

The October 22 bounded reconciliation added 12 records and reviewed current evidence for 41 existing relationships. The [per-ID research log](https://github.com/rabookire/international-healthcare-brief/blob/main/docs/research/reconciliation-2026-10-22.md) describes decisions and holds. This is not an exhaustive scan or a change to the 19-institution cohort or editorial needle test. Source dates are never replaced by the date a page was checked.
