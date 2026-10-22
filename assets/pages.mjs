import {
  TACTICS,
  escapeHTML as e,
  safeURL,
  filterRecords,
  institutionsOf,
  stateQuery,
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
  heading,
  filters,
  resultBar,
  table,
  empty,
  briefSources,
}) {
  const countries = [...new Set(records.map((r) => r.country))].sort();
  if (!state.country)
    return (
      heading(
        "Country briefs",
        "Explore markets",
        "Understand documented participants, relationship models and recent developments. Every country view includes evidence and coverage limits.",
      ) +
      `<p class="notice">Only countries represented in the partial inventory appear below. Absence from this list is not an absence of international healthcare activity.</p><div class="institution-grid">${countries
        .map((country) => {
          const rows = records.filter((r) => r.country === country);
          return `<a class="institution-card" href="${url("markets/?country=" + encodeURIComponent(country))}"><h2>${e(country)}</h2><p>${rows.length} documented records · ${new Set(rows.flatMap(institutionsOf)).size} U.S. institutions</p><p>${e(regionText(rows[0].region))}</p></a>`;
        })
        .join("")}</div>`
    );
  const allRows = records.filter((r) => r.country === state.country),
    rows = filterRecords(records, state);
  const names = [...new Set(rows.flatMap(institutionsOf))].sort(),
    unknown = rows.filter((r) => r.status === "Unknown").length;
  const latest = [...rows]
    .filter((r) => eventDate(r))
    .sort((a, b) => eventDate(b).localeCompare(eventDate(a)))
    .slice(0, 5);
  return (
    `<a href="${url("markets/")}">← All country briefs</a>` +
    heading(
      "Country brief",
      e(state.country),
      "Publicly documented activity involving U.S. health systems. Source dates and lifecycle are retained; the inventory is partial.",
    ) +
    filters() +
    `<div class="notice">${allRows.length} country records in the full inventory; ${rows.length} match this view. ${unknown} matching records have status not established. These counts do not establish market size or available patient flows.</div>` +
    (rows.length
      ? `<section class="market-overview"><div><h2>Participating U.S. institutions</h2><ul>${names.map((n) => `<li><a href="${url("institutions/?institution=" + encodeURIComponent(n))}">${e(n)}</a></li>`).join("")}</ul></div><div><h2>Documented relationship models</h2><ul>${Object.entries(
          TACTICS,
        )
          .map(([t, label]) => [
            label,
            rows.filter(
              (r) => r.tactic_primary === t || r.tactic_secondary?.includes(t),
            ).length,
          ])
          .filter(([, count]) => count)
          .map(([label, count]) => `<li>${e(label)} · ${count} records</li>`)
          .join(
            "",
          )}</ul><p class="small muted">A relationship can have several activity types; category counts overlap. A facility label does not establish ownership.</p></div></section><section><h2>Latest recorded developments</h2>${latest.length ? `<ol class="market-timeline">${latest.map((r) => `<li><time>${e(fmt(eventDate(r)))}</time> <button class="record-title" data-record="${e(r.id)}">${e(r.headline)}</button></li>`).join("")}</ol>` : "<p>Material event dates are not established for these records.</p>"}</section>`
      : "") +
    resultBar(rows, "map/") +
    (rows.length ? table(rows) : empty()) +
    briefSources(rows)
  );
}

export function comparePage({
  records,
  names,
  state,
  fmt,
  heading,
  filters,
  briefSources,
}) {
  const selected = [...new Set(state.institution)].filter((n) =>
    names.includes(n),
  );
  const rows = filterRecords(records, {
    ...state,
    institution: [],
    record: "",
  });
  const summaries = selected.map((n) => institutionSummary(rows, n));
  const uniqueRows = rows.filter((r) =>
    institutionsOf(r).some((n) => selected.includes(n)),
  );
  const introduction =
    heading(
      "Research workspace",
      "Compare institutions",
      "Choose two or three institutions to compare documented activity across the same dimensions. Coverage differs; counts are not rankings.",
    ) + filters();
  if (
    selected.length < 2 ||
    selected.length > 3 ||
    selected.length !== state.institution.length
  )
    return (
      introduction +
      '<div class="empty-state"><h2>Choose two or three listed institutions</h2><p>Use the Institutions control above. Country, lifecycle and activity filters apply to every comparison column.</p></div>'
    );
  const countries = [...new Set(summaries.flatMap((s) => s.countries))].sort();
  const metricRow = (label, fn) =>
    `<tr><th scope="row">${label}</th>${summaries.map((s) => `<td>${fn(s)}</td>`).join("")}</tr>`;
  return (
    introduction +
    `<p class="notice">A shared agreement retains one record ID and can appear in several institution columns. A missing entry means no documented record in this view; it does not establish no activity. “Owned / operated” is a broad category: inspect the source for each institution’s actual role.</p><div class="result-tools compare-tools"><button data-copy>Copy comparison</button><button data-download>Export selected records</button><button data-print>Print cited comparison</button></div><div class="table-wrap"><table class="comparison-table"><caption>Comparison of documented records in the selected view</caption><thead><tr><th scope="col">Dimension</th>${summaries.map((s) => `<th scope="col">${e(s.name)}</th>`).join("")}</tr></thead><tbody>${metricRow("Documented records", (s) => String(s.rows.length))}${metricRow("Countries represented", (s) => String(s.countries.length))}${metricRow("Status not established", (s) => String(s.unknown))}${metricRow("Latest recorded event", (s) => e(fmt(s.latest)))}${Object.entries(
      TACTICS,
    )
      .map(([t, label]) =>
        metricRow(e(label), (s) =>
          s.byTactic(t).length
            ? String(s.byTactic(t).length)
            : "No documented record",
        ),
      )
      .join("")}</tbody></table></div><h2>Country and relationship detail</h2>${
      countries.length
        ? `<div class="table-wrap"><table class="comparison-table"><caption>Shared record IDs identify shared agreements. Activity types can overlap.</caption><thead><tr><th scope="col">Country</th>${selected.map((n) => `<th scope="col">${e(n)}</th>`).join("")}</tr></thead><tbody>${countries
            .map(
              (country) =>
                `<tr><th scope="row">${e(country)}</th>${summaries
                  .map(
                    (s) =>
                      `<td>${
                        s.rows
                          .filter((r) => r.country === country)
                          .map(
                            (r) =>
                              `<p><button class="record-title" data-record="${e(r.id)}">${e(r.headline)}</button><small>${e(r.id)} · ${e(statusText(r))}</small></p>`,
                          )
                          .join("") || "No documented record"
                      }</td>`,
                  )
                  .join("")}</tr>`,
            )
            .join("")}</tbody></table></div>`
        : "<p>No documented records match these filters. Broaden the selection.</p>"
    }` +
    briefSources(uniqueRows)
  );
}
