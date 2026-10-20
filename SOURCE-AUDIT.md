# Source sample audit — 2026-10-20

Ten representative seeded records were opened and checked against primary sources in the managing review. These checks support the bounded claims below; they are not an exhaustive content or link-uptime audit. Unstated day-level historical dates remain blank. One narrow strategic-affiliation record uses clearly labeled reputable secondary coverage because the partner’s direct announcement is no longer retrievable. No LinkedIn sources are used.

| Record | Claim checked | Outcome |
| --- | --- | --- |
| IHB-0002 | Cleveland Clinic Canada provides in-person care at Toronto clinics. | Primary page explicitly describes its Toronto clinics. |
| IHB-0017 | Allshores gives eligible Bermuda members overseas-care access to Cleveland Clinic. | September 16, 2026 institutional release supports payer access; no Bermuda facility is implied. |
| IHB-0018 | Mayo Clinic Healthcare has an outpatient clinic at 15 Portland Place, London. | Current Mayo page names the clinic and address. |
| IHB-0048 | Johns Hopkins Aramco Healthcare is a Saudi joint venture. | Current Hopkins page explicitly identifies the venture; no exact historical day inferred. |
| IHB-0050 | MSK/Qatar have a non-binding MOU exploring a Doha cancer partnership. | MSK release distinguishes the MOU from an operating facility; record remains Announced. |
| IHB-0061 | UPMC and Sicily maintain the ISMETT hospital partnership in Palermo. | UPMC facility page explicitly names the hospital, location and public-private partnership. |
| IHB-0072 | UCLA advises the development of Kingdom University Hospital in Jordan. | Current UCLA page identifies Amman, advisory role and planned opening; no operating-hospital claim. |
| IHB-0077 | NewYork-Presbyterian collaborates with KidsHeart in Dubai on pediatric cardiac services. | Current NYP collaborations page explicitly names the clinical scope and location. |
| IHB-0079 | Penn/Vingroup's Vietnam alliance includes clinical care and hospital-staff operational improvement. | Penn clinical-care page explicitly describes the operational component. |
| IHB-0080 | Dana-Farber advises OncoClinic in Saudi Arabia. | February 5, 2026 Dana-Farber release names advisory support; the separate owners' joint venture is not misrepresented as Dana-Farber ownership. |

The direct linked sources for these IDs are in [tracker.csv](data/tracker.csv) and [evidence.json](data/evidence.json).

## Source-access and scope corrections

- Ten Mayo office detail URLs initially retrieved but repeatedly timed out on recheck. Their country-level claims now link to Mayo's working official representative-office directory. Unsupported city specificity was removed. Exact office start dates remain unknown.
- A Hopkins AIH page contained a conflicting external hyperlink. The Vietnam row now cites AIH's own primary release explicitly establishing the location and continuing clinical cooperation.
- Cedars-Sinai's Shanghai and Doha city-specific office references from June 2025 were held. A separately opened May 20, 2026 institutional release explicitly confirms patient referral offices in China and Qatar; IHB-0091/0092 therefore use country-level locators, without inferring the cities.
- UPMC's co-located Hillman Waterford service was consolidated into the Whitfield hospital record rather than counted again as a separate hospital footprint.
- UPMC Kildare's September 28 ownership update was verified by a specialist against UPMC's release and supporting original-deal/regulatory sources. A managing-review attempt to re-fetch the release failed intermittently. Its direct link is retained with supporting sources; uniform source availability is not claimed.

See [Seed report](SEED-REPORT.md) for institution-specific holds, exclusions and incomplete research scope. Publication-time review must recheck every source that is used in a new edition.

## Twelve-month expansion review

Historical events now cover October 20, 2025–October 19, 2026 under the same sourcing rules. Existing record IDs retain the change history; no historical brief editions were created. The initial expansion adds six agreements/projects and reclassifies five existing baseline records with proven in-window events, for 14 dated historical records in total.

- IHB-0085 retains one clinic record across its January 16 planned description and May 20 open confirmation; the exact first-patient date remains unknown.
- IHB-0097 is a narrow Houston Methodist/Alameda strategic-affiliation announcement, flagged Secondary. Khaleej Times’ February 18 report explicitly dates the announcement to January 2026. The exact announcement day is blank; month precision is validated without inventing a date. Its supporting secondary reports are not represented as two independent sources for a major-item fallback.
- IHB-0098 retains the original May 21, 2025 Limerick announcement plus the development counterparty’s October 12, 2026 final-construction-stage update. It remains In development.
- IHB-0096 is admitted narrowly for explicit, named-facility clinical advisory and patient-case consultation access, rather than membership alone. No ownership or completed consultation is inferred.
- Vague MoUs, standalone training, routine meetings, local affiliate insurer renewals without US-institution involvement, and sources that could not be fully retrieved remain held in data/held-candidates.json.
