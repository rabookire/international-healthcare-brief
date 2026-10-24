import {
  activityIcon,
  activityCollection,
  hospitalBrief,
  developmentList,
  comparisonLink,
} from "./presentation.mjs";
import {
  TACTICS,
  escapeHTML as e,
  safeURL,
  filterRecords,
  institutionsOf,
  stateQuery,
  countriesOf,
} from "./core.mjs";
import {
  coverageSummary,
  institutionSummary,
  eventDate,
  statusText,
  regionText,
} from "./research.mjs";

export function printSources(rows, { data, state, fmt }) {
  return `<section class="print-sources"><h2>Evidence for this view</h2><p>Partial public-source inventory checked ${e(fmt(data.generated_as_of))}. Reader ${e(data.reader_version)}. ${rows.length} documented records. Counts do not measure investment, patient volume or market share.</p><p>View filters: ${e(stateQuery(state) || "All records")}. Dataset SHA-256: ${e(data.source_sha256)}.</p><ol>${rows
    .map(
      (r) =>
        `<li><h3>${e(r.id)} · ${e(r.headline)}</h3><p>${e(r.institution)} · ${e(r.partner)} · ${e(r.country)} · ${e(TACTICS[r.tactic_primary])} · ${e(statusText(r))}</p><p>Latest event: ${e(fmt(eventDate(r)))}. Source checked: ${e(fmt(r.last_verified))}. Associated facility: ${e(r.facility_status || "Not established")}.</p>${[
          r.status_note,
          r.scope_note,
          r.source_note,
        ]
          .filter(Boolean)
          .map((n) => `<p>${e(n)}</p>`)
          .join("")}<p>${e(r.analysis)}</p>${[
          ...new Set([r.source_url, ...(r.sources || []).map((s) => s.url)]),
        ]
          .filter(Boolean)
          .map((u) => `<p><a href="${e(safeURL(u))}">${e(u)}</a></p>`)
          .join("")}</li>`,
    )
    .join("")}</ol></section>`;
}

export function coveragePage({ records, names, coverage, data, fmt, url }) {
  const counts = coverageSummary(records, names);
  return `<article class="coverage-page"><div class="eyebrow">Read the boundaries</div><h1>Coverage &amp; gaps</h1><p class="lede">A record documents a public relationship. A missing record does not establish an absence of activity.</p><div class="coverage-stats"><div><strong>${counts.records}</strong><span>documented records</span></div><div><strong>${counts.countries}</strong><span>countries in the inventory</span></div><div><strong>${counts.institutions} / ${counts.listed}</strong><span>listed institutions with records</span></div><div><strong>${counts.unknown}</strong><span>records with status not established</span></div></div><p>Sources were checked for the inventory dated ${e(fmt(data.generated_as_of))}. Reader updates do not advance that date. The initial historical review covers ${e(fmt(data.backfill_start))} through ${e(fmt(data.backfill_end))}; it is a fixed launch window.</p><div class="notice"><strong>Current boundaries</strong><p>U.S. health systems are the tracked institutions. Other organizations appear as counterparties; this is not a complete global competitor inventory. Research partnerships are now in scope, but systematic research coverage is pending. Record counts are not patient volumes, financial scale or rankings.</p></div><h2>How to read lifecycle</h2><p>Active / operational describes the documented relationship. An advisory engagement can be active while its associated hospital remains planned. Status not established means available structured evidence does not establish current lifecycle; it does not mean inactive. Initial-inventory and historical labels describe publication history only.</p><h2>Institution coverage</h2><p>Open an institution below for the scope reviewed and unresolved sourcing questions. These notes describe a bounded public-source review, not continuous monitoring.</p><div class="coverage-list">${names
    .map((name) => {
      const note = coverage.find((c) => c.institution === name),
        rows = records.filter((r) => institutionsOf(r).includes(name));
      const unresolved = Array.isArray(note?.unresolved)
        ? note.unresolved.join(" ")
        : note?.unresolved;
      return `<details><summary>${e(name)} <span>${rows.length} documented ${rows.length === 1 ? "record" : "records"}${rows.length ? "" : " · Coverage gap"}</span></summary><div><p><strong>Reviewed:</strong> ${e(typeof note?.scope_checked === "string" ? note.scope_checked : "Review scope not yet documented.")}</p><p><strong>Historical review:</strong> ${e(note?.backfill_status || "Review not documented.")}</p><p><strong>Open questions:</strong> ${e(unresolved || "No additional questions documented. This is not a completeness guarantee.")}</p><a href="${url("institutions/?institution=" + encodeURIComponent(name))}">Institution profile</a></div></details>`;
    })
    .join(
      "",
    )}</div><p><a href="${url("methodology/")}">Full methodology and source standard</a> · <a href="https://github.com/rabookire/international-healthcare-brief/issues/new?template=correction.yml">Suggest a sourced correction</a></p></article>`;
}

export function marketsPage({
  records,
  state,
  fmt,
  url,
  filters,
  empty,
  marketSelected = [],
}) {
  const countries = [...new Set(records.flatMap(countriesOf))].sort();
  if (!state.country) {
    const rows = filterRecords(records, state);
    const available = countries.filter((country) =>
      rows.some((r) => countriesOf(r).includes(country)),
    );
    return `<h1 class="reader-title">Markets</h1>${filters({ omitInstitution: true })}<div class="market-directory">${available
      .map((country) => {
        const inMarket = rows.filter((r) => countriesOf(r).includes(country));
        const institutions = [...new Set(inMarket.flatMap(institutionsOf))];
        return `<a class="market-choice" href="${url("markets/?" + stateQuery({ ...state, country, record: "" }))}"><h2>${e(country)}</h2><span>${e(institutions.slice(0, 3).join(" · "))}${institutions.length > 3 ? ` · +${institutions.length - 3}` : ""}</span></a>`;
      })
      .join("")}</div>${available.length ? "" : empty()}`;
  }
  const rows = filterRecords(records, state),
    names = [...new Set(rows.flatMap(institutionsOf))].sort();
  return `<h1 class="reader-title">${e(state.country)}</h1>${filters({ omitInstitution: true })}
    <div class="market-compare-action"><span class="sr-only" role="status">${names.length} institutions in this view</span><a class="button" data-market-compare-run href="${comparisonLink(marketSelected, state, url)}" ${marketSelected.length < 2 ? 'aria-disabled="true"' : ""}>Compare selected <span data-market-compare-count>${marketSelected.length ? `(${marketSelected.length})` : ""}</span></a></div>
    ${
      rows.length
        ? `<div class="market-hospitals">${names.map((n) => hospitalBrief(n, rows, { url, market: true, chosen: marketSelected, state })).join("")}</div>
    <div class="market-support"><section aria-labelledby="market-location-title"><h2 id="market-location-title">Location</h2><div id="market-location" class="market-location"></div><a href="${url("map/?" + stateQuery({ ...state, view: "map" }))}">Explore this market</a></section><section aria-labelledby="market-developments-title"><h2 id="market-developments-title">Recent developments</h2>${developmentList(rows, { fmt })}</section></div>`
        : empty()
    }`;
}
export function comparePage({
  records,
  names,
  state,
  fmt,
  url,
  filters,
  compareSlots = 2,
  compareChoices = null,
}) {
  const selected = [...new Set(state.institution)]
    .filter((n) => names.includes(n))
    .slice(0, 3);
  const slots = Math.max(2, compareSlots, selected.length);
  const chooser = `<div class="compare-chooser" style="--compare-columns:${slots}">${Array.from(
    { length: slots },
    (_, i) => {
      const name = (compareChoices || selected)[i] || "";
      return `<div class="compare-slot"><label for="compare-slot-${i}">Institution ${i + 1}</label><div><input id="compare-slot-${i}" data-compare-slot="${i}" type="search" list="compare-options-${i}" placeholder="Search institutions" value="${e(name)}" autocomplete="off" aria-describedby="compare-selection-help">${name || i === 2 ? `<button data-compare-remove="${i}" aria-label="Remove institution ${i + 1}">${e(name ? "Remove" : "Cancel")}</button>` : ""}</div><datalist id="compare-options-${i}">${names
        .filter((n) => n === name || !selected.includes(n))
        .map((n) => `<option value="${e(n)}"></option>`)
        .join("")}</datalist></div>`;
    },
  ).join(
    "",
  )}</div><p id="compare-selection-help" class="sr-only">Choose two institutions, or add a third. Search and select a listed institution.</p>${slots < 3 ? '<button class="add-comparison" data-compare-add>Add a third institution</button>' : ""}`;
  const intro = `<h1 class="reader-title">Compare institutions</h1>${chooser}${filters({ omitInstitution: true })}`;
  if (selected.length < 2)
    return (
      intro +
      '<div class="empty-state"><h2>Choose two institutions to compare</h2></div>'
    );
  const rows = filterRecords(records, {
    ...state,
    institution: [],
    record: "",
  });
  const summaries = selected.map((n) => {
    const summary = institutionSummary(rows, n);
    if (state.country)
      summary.countries = summary.countries.filter((c) => c === state.country);
    return summary;
  });
  const tactics = Object.keys(TACTICS).filter((t) =>
    summaries.some((s) => s.byTactic(t).length),
  );
  const cell = (s, body) =>
    `<div class="comparison-value" aria-label="${e(s.name)}">${body}</div>`;
  const dimension = (label, values) =>
    `<section class="comparison-dimension"><h2>${label}</h2><div class="comparison-values" style="--compare-columns:${selected.length}">${values}</div></section>`;
  return (
    intro +
    `<div class="visual-comparison" style="--compare-columns:${selected.length}"><div class="comparison-names">${selected.map((n) => `<h2><a href="${url("institutions/?institution=" + encodeURIComponent(n))}">${e(n)}</a></h2>`).join("")}</div>
    ${dimension("Verified markets", summaries.map((s) => cell(s, s.countries.length ? `<strong class="comparison-number">${s.countries.length}</strong><span class="sr-only">verified markets</span><ul class="market-chips">${s.countries.map((c) => `<li><a href="${url("markets/?" + stateQuery({ ...state, institution: [], country: c, record: "" }))}">${e(c)}</a></li>`).join("")}</ul>` : '<p class="muted">No verified current records for these filters.</p>')).join(""))}
    ${tactics
      .map((t) =>
        dimension(
          `${activityIcon(t, url)}<span>${e(TACTICS[t])}</span>`,
          summaries
            .map((s) => {
              const matches = s.byTactic(t);
              return cell(
                s,
                matches.length
                  ? activityCollection(matches, {
                      url,
                      country: !state.country,
                      state,
                    })
                  : '<span class="no-evidence" role="img" aria-label="No verified record in this dataset" title="No verified record in this dataset">—</span>',
              );
            })
            .join(""),
        ),
      )
      .join("")}
    ${dimension("Recent developments", summaries.map((s) => cell(s, developmentList(s.rows, { fmt, limit: 2 }))).join(""))}
  </div>`
  );
}
