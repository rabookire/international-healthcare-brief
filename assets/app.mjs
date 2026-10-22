import {
  HOME,
  constrain,
  zoomAt,
  panBy,
  fitPoints,
  spreadPoints,
  revealPoint,
} from "./map-camera.mjs";
import {
  LENSES,
  STATUS_LABELS,
  statusText,
  historyText,
  eventDate,
  regionText,
  coverageSummary,
  filterChips,
  secondaryMatch,
} from "./research.mjs";
import { recordDetail } from "./record-view.mjs";
import { renderProfile, PROFILE_COLORS, profileSymbol } from "./profile.mjs";
import {
  coveragePage,
  marketsPage,
  comparePage,
  printSources,
} from "./pages.mjs";
import {
  TACTICS,
  COLORS,
  STATUSES,
  REGIONS,
  institutionsOf,
  readState,
  stateQuery,
  filterRecords,
  sortRecords,
  escapeHTML as e,
  safeURL,
  csvExport,
  project,
  parseMarkdown,
  filterEditions,
} from "./core.mjs";
const ROOT = new URL(document.body.dataset.root, location.href),
  page = document.body.dataset.page,
  main = document.querySelector("#main"),
  dialog = document.querySelector("#record-dialog");
const url = (p = "") => new URL(p, ROOT).href;
const stateOptions = { defaultView: page === "institutions" ? "map" : "list" };
let data,
  records = [],
  names = [],
  coverage = [],
  editions = [],
  world,
  places,
  state = readState(location.search, stateOptions),
  visible = [],
  sortKey = "last_verified",
  sortDir = -1,
  mapZoom = 1,
  mapCenter = [500, 220],
  moreFiltersOpen = false,
  mapCleanup = () => {};
const fmt = (s) =>
  !s
    ? "Not stated"
    : /^\d{4}-\d{2}$/.test(s)
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(s + "-01T12:00:00Z")) + " (day not disclosed)"
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(s + "T12:00:00Z"));
const eventKey = eventDate;
const instLink = (n) =>
  url("institutions/?institution=" + encodeURIComponent(n));
const tag = (r) =>
  `<span class="tag ${r.seed_kind !== "baseline" ? "new" : ""}">${e(historyText(r))}</span>`;
const statusLabel = statusText;
const isWorkspace = () => page === "map" || page === "home";
const isProfile = () =>
  page === "institutions" &&
  state.institution.length === 1 &&
  names.includes(state.institution[0]);
const icon = (n) =>
  `<img class="icon" src="${url("assets/icons/" + n + ".svg")}" alt="" width="20" height="20">`;
function shell() {
  document.body.classList.toggle("workspace-page", isWorkspace());
  document.querySelector("#header").innerHTML =
    `<header class="app-header"><a class="wordmark" href="${url()}"><span>International</span>Healthcare Brief</a><nav class="app-nav" aria-label="Main navigation">${[
      ["map", "map/", "Explore"],
      ["institutions", "institutions/", "Institutions"],
      ["markets", "markets/", "Markets"],
      ["compare", "compare/", "Compare"],
    ]
      .map(
        ([p, u, l]) =>
          `<a href="${url(u)}" ${p === page || (p === "map" && (page === "home" || page === "tracker")) ? 'aria-current="page"' : ""}>${l}</a>`,
      )
      .join(
        "",
      )}</nav><a class="method-link" href="${url("methodology/")}" ${page === "methodology" ? 'aria-current="page"' : ""}>About &amp; sources</a></header>`;
  document.querySelector("#footer").innerHTML =
    `<footer class="app-footer"><span>Partial inventory · <a href="${url("coverage/")}">Coverage &amp; gaps</a></span><span id="as-of"></span><details class="about-publication"><summary>Independent · Public sources</summary><div><p>Independent publication for hospital leaders and advisers. No institutional affiliation or endorsement. Analysis is labeled. No tracking.</p><a href="${url("methodology/")}">Methodology</a> · <a href="${url("updates/")}">Updates</a> · <a href="https://github.com/rabookire/international-healthcare-brief">Source code</a> · <a href="https://github.com/rabookire/international-healthcare-brief/issues/new?template=correction.yml">Suggest a correction</a></div></details></footer>`;
}
async function get(path) {
  const r = await fetch(url(path), { credentials: "omit" });
  if (!r.ok) throw Error(`${path}: HTTP ${r.status}`);
  return r.json();
}
function change(patch, replace = false) {
  const active = document.activeElement,
    focus = active?.dataset?.filter,
    view = active?.dataset?.view,
    sort = active?.dataset?.sort;
  if (
    (isWorkspace() || isProfile()) &&
    ["country", "institution", "region", "tactic"].some((key) => key in patch)
  ) {
    mapZoom = 1;
    mapCenter = [500, 220];
  }
  if (isProfile() && "region" in patch) patch = { ...patch, country: "" };
  state = { ...state, ...patch };
  const q = stateQuery(state);
  history[replace ? "replaceState" : "pushState"](
    null,
    "",
    location.pathname + (q ? "?" + q : ""),
  );
  render();
  const target = focus
    ? main.querySelector(`[data-filter="${focus}"]`)
    : view
      ? main.querySelector(`[data-view="${view}"]`)
      : sort
        ? main.querySelector(`[data-sort="${sort}"]`)
        : main.querySelector("[data-reset]");
  target?.focus({ preventScroll: true });
}
window.addEventListener("popstate", () => {
  state = readState(location.search, stateOptions);
  if (isWorkspace() || isProfile()) {
    mapZoom = 1;
    mapCenter = [500, 220];
  }
  render();
});
function list(items, { limit = Infinity, timeline = false } = {}) {
  return `<ul class="record-list ${timeline ? "timeline" : ""}">${items
    .slice(0, limit)
    .map(
      (r) =>
        `<li><div class="meta"><span>${e(r.country)} / ${e(r.region)}</span>${tag(r)}<span>${e(r.id)}</span>${eventKey(r) ? `<span>${e(fmt(eventKey(r)))}</span>` : ""}</div><h3><button class="record-title" data-record="${e(r.id)}">${e(r.headline)}</button></h3><p>${e(r.institution)} · ${e(statusLabel(r))}</p><a class="source-link" href="${e(safeURL(r.source_url))}" target="_blank" rel="noopener noreferrer">${e(r.source_type)} source ↗</a></li>`,
    )
    .join("")}</ul>`;
}
function heading(kicker, title, description, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}

function selectField(key, label, items) {
  const options = items.map((o) => (Array.isArray(o) ? o : [o, o]));
  if (key === "region" && state.region === "Other")
    options.push(["Other", regionText("Other")]);
  return `<label class="compact-select"><span>${e(label)}</span><select data-filter="${key}" aria-label="${e(label)}"><option value="">All ${e(label.toLowerCase())}</option>${options.map(([v, t]) => `<option value="${e(v)}" ${state[key] === v ? "selected" : ""}>${e(t)}</option>`).join("")}</select></label>`;
}
function institutionControl() {
  const all = [...new Set([...names, ...records.flatMap(institutionsOf)])];
  return `<details class="institutions-filter"><summary>${e(state.institution.length === 1 ? state.institution[0] : state.institution.length ? state.institution.length + " institutions" : "Institutions")}${icon("chevron-down")}</summary><div class="checklist">${all.map((n) => `<label><input type="checkbox" data-institution="${e(n)}" ${state.institution.includes(n) ? "checked" : ""} ${page === "compare" && state.institution.length >= 3 && !state.institution.includes(n) ? "disabled" : ""}>${e(n)}</label>`).join("")}<p class="small muted">${page === "compare" ? "Choose two or three institutions." : "Any selected institution matches; other filters narrow the results."}</p>${state.institution.length ? "<button data-clear-institutions>Clear institutions</button>" : ""}</div></details>`;
}
function activeFilters() {
  const chips = filterChips(state, TACTICS);
  return chips.length
    ? `<div class="active-filters" aria-label="Active filters">${chips.map((c) => `<button data-remove-key="${e(c.key)}" data-remove-value="${e(c.value)}" aria-label="Remove filter: ${e(c.label)}">${e(c.label)} <span aria-hidden="true">×</span></button>`).join("")}</div>`
    : "";
}
function scopeNotice() {
  return state.lens === "research" || state.tactic === "T10"
    ? '<p class="notice">Research partnerships are now in scope, but systematic research coverage has not been completed. No results here must not be read as no research activity.</p>'
    : "";
}
function filters({ archive = false } = {}) {
  const countries = [
    ...new Set([
      ...records.map((r) => r.country),
      ...(archive
        ? editions.flatMap((ed) => [
            ...(ed.countries || []),
            ...(ed.items || []).map((item) => item.country).filter(Boolean),
          ])
        : []),
    ]),
  ].sort();
  const years = [
    ...new Set(
      records
        .map((r) => (r.operational_date || "").slice(0, 4))
        .filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  if (state.year && !years.includes(state.year)) years.unshift(state.year);
  return `<section class="filter-panel" aria-label="Filter records"><div class="workspace-filters">${institutionControl()}${selectField("country", "Country", countries)}${selectField(
    "lens",
    "Focus",
    Object.entries(LENSES).map(([k, v]) => [k, v.label]),
  )}${selectField("tactic", "Activity type", Object.entries(TACTICS))}${selectField("region", "Region", REGIONS)}${selectField("status", "Lifecycle", Object.entries(STATUS_LABELS))}${selectField("year", "Opening year", years)}</div><div class="filter-bottom"><label class="field">Search<input class="search-input" id="record-search" type="search" placeholder="Institution, partner, place or activity" value="${e(state.q)}"></label><div class="footprint-control" aria-label="Inventory history">${[
    ["all", "All history"],
    ["baseline", "Initial inventory"],
    ["new", "Dated activity"],
  ]
    .map(
      ([v, l]) =>
        `<button data-footprint="${v}" aria-pressed="${state.footprint === v}">${l}</button>`,
    )
    .join(
      "",
    )}</div>${archive ? `<label>From <input type="date" data-filter="from" value="${e(state.from)}"></label><label>To <input type="date" data-filter="to" value="${e(state.to)}"></label>` : ""}<button data-reset>Clear filters</button></div></section>${activeFilters()}${scopeNotice()}`;
}

function table(rows) {
  const columns = [
    ["headline", "Activity"],
    ["institution", "Institution"],
    ["country", "Location"],
    ["tactic_primary", "Activity type"],
    ["status", "Lifecycle"],
    ["latest_event_date", "Latest event"],
  ];
  return `<div class="table-wrap"><table><caption class="small muted">${rows.length} matching documented records. Unknown dates and status are not inferred.</caption><thead><tr>${columns.map(([key, label]) => `<th scope="col" ${sortKey === key ? `aria-sort="${sortDir === 1 ? "ascending" : "descending"}"` : ""}><button data-sort="${key}">${label}${sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead><tbody>${sortRecords(
    rows,
    sortKey,
    sortDir,
  )
    .map(
      (r) =>
        `<tr><td class="table-headline"><button class="record-title" data-record="${e(r.id)}">${e(r.headline)}</button><small>${e(r.id)} · <a href="${e(safeURL(r.source_url))}" target="_blank" rel="noopener noreferrer">${e(r.source_type)} source ↗</a></small></td><td>${institutionsOf(
          r,
        )
          .map((n) => `<a href="${instLink(n)}">${e(n)}</a>`)
          .join(
            "<br>",
          )}</td><td>${e(r.country)}<small>${e(r.city || "Country-level location")} · ${e(regionText(r.region))}</small></td><td>${e(TACTICS[r.tactic_primary])}${r.tactic_secondary?.length ? `<small>Also: ${e(r.tactic_secondary.map((t) => TACTICS[t]).join("; "))}</small>` : ""}</td><td>${e(statusLabel(r))}${r.facility_status && r.facility_status !== "Not applicable" ? `<small>Facility: ${e(r.facility_status)}</small>` : ""}</td><td>${e(fmt(eventKey(r)))}<small>Source checked ${e(fmt(r.last_verified))}</small></td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function resultBar(rows, target) {
  return `<div class="result-bar"><div role="status" aria-live="polite"><span class="record-count">${rows.length} documented records</span> <span class="muted">of ${records.length} in this inventory</span></div><div class="result-tools"><a class="button" href="${url(target + "?" + stateQuery(state))}">${target === "map/" ? "Map & list" : "Table view"}</a><button data-download>Export CSV</button><button data-copy>Copy view</button><button data-print>Print brief</button></div></div>`;
}
function empty() {
  return '<div class="empty-state"><h2>No records match these filters</h2><p>Try a broader selection. The inventory is partial. Missing records do not establish an absence of activity.</p><button data-reset>Reset filters</button></div>';
}
function renderHome() {
  renderMap();
}

function renderTracker() {
  visible = filterRecords(records, state);
  main.innerHTML =
    heading(
      "Public-source inventory",
      "Activity tracker",
      "Compare documented relationships, inspect their evidence, and export the selected records.",
    ) +
    filters() +
    resultBar(visible, "map/") +
    (visible.length ? table(visible) : empty()) +
    briefSources(visible);
}

function workspaceFilters() {
  const countries = [...new Set(records.map((r) => r.country))].sort();
  const years = [
    ...new Set(
      [
        data.generated_as_of.slice(0, 4),
        state.year,
        ...records.map((r) => r.operational_date?.slice(0, 4)),
      ].filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  const moreCount = [
    state.region,
    state.status,
    state.year,
    state.footprint !== "all" ? state.footprint : "",
  ].filter(Boolean).length;
  return `<section class="workspace-filters" aria-label="Filter records">${institutionControl()}${selectField("country", "Country", countries)}${selectField(
    "lens",
    "Focus",
    Object.entries(LENSES).map(([k, v]) => [k, v.label]),
  )}<details class="more-filters" ${moreFiltersOpen ? "open" : ""}><summary>More filters${moreCount ? " (" + moreCount + ")" : ""}${icon("sliders")}</summary><div class="more-filter-panel">${selectField("tactic", "Activity type", Object.entries(TACTICS))}${selectField("region", "Region", REGIONS)}${selectField("status", "Lifecycle", Object.entries(STATUS_LABELS))}${selectField("year", "Opening year", years)}<div class="footprint-control" aria-label="Inventory history">${[
    ["all", "All history"],
    ["baseline", "Initial inventory"],
    ["new", "Dated activity"],
  ]
    .map(
      ([v, l]) =>
        `<button data-footprint="${v}" aria-pressed="${state.footprint === v}">${l}</button>`,
    )
    .join(
      "",
    )}</div></div></details><button class="clear-filters" data-reset>Clear filters</button><div class="workspace-actions"><a class="button" href="${url("data/?" + stateQuery(state))}">Table</a><button data-copy>Copy view</button><button data-download>${icon("download")}<span>Export CSV</span></button></div></section>`;
}

function activityRows(rows, { country = false } = {}) {
  return `<ul class="activity-list">${rows
    .map((r) => {
      const matched = secondaryMatch(r, state, TACTICS);
      return `<li><button class="activity-row ${state.record === r.id ? "selected" : ""}" data-record="${e(r.id)}" aria-pressed="${state.record === r.id}"><span class="activity-main"><strong>${e(r.headline)}</strong><span class="activity-partner">${e(r.institution)} · ${e(r.partner)}</span><span class="activity-country">${e(r.country)} · ${e(fmt(eventKey(r)))}</span><span class="activity-type">${e(TACTICS[r.tactic_primary])}</span>${matched ? `<span class="matched-tag">Matched: ${e(matched)}</span>` : ""}<span class="activity-lifecycle">${e(statusLabel(r))}</span></span>${icon("chevron-right")}</button></li>`;
    })
    .join("")}</ul>`;
}

function renderMap() {
  visible = filterRecords(records, state);
  const counts = coverageSummary(records, names),
    countries = new Set(visible.map((r) => r.country)).size;
  main.innerHTML = `<section class="workspace-heading"><div class="workspace-title"><div><div class="eyebrow">U.S. health systems abroad</div><h1>Global partnerships explorer</h1></div><span role="status" aria-live="polite">${visible.length} ${visible.length === 1 ? "result" : "results"}</span></div><p class="workspace-intro">Explore publicly documented facilities, partnerships and patient-access channels involving U.S. health systems.</p><p class="inventory-line">Partial inventory · ${counts.records} records · ${counts.countries} countries · Records for ${counts.institutions} of ${counts.listed} listed institutions · <a href="${url("coverage/")}">Coverage &amp; gaps</a></p><label class="results-search global-search">${icon("search")}<span class="sr-only">Search records</span><input id="record-search" type="search" placeholder="Search institutions, partners, places or activities" value="${e(state.q)}"></label>${workspaceFilters()}${activeFilters()}${scopeNotice()}<div class="mobile-view-switch" role="group" aria-label="Explore view"><button data-view="list" aria-pressed="${state.view === "list"}">List</button><button data-view="map" aria-pressed="${state.view === "map"}">Map</button><a href="${url("data/?" + stateQuery(state))}">Table</a></div></section><div class="research-workspace" data-mobile-view="${e(state.view)}"><aside class="activity-pane" aria-label="Matching activities"><div class="activity-context"><h2>Matching activity</h2><span>${countries} ${countries === 1 ? "country" : "countries"}</span></div><div id="country-panel"></div>${visible.length ? activityRows([...visible].sort((a, b) => eventKey(b).localeCompare(eventKey(a)) || a.institution.localeCompare(b.institution))) : empty()}</aside><section class="map-canvas" aria-label="Activity map"><p class="sr-only" id="map-help">Approximate locations, not patient volumes. Arrow keys pan the map; plus and minus zoom. Enter moves to the first pin; arrow keys move between pins. Select any activity from the equivalent list.</p><svg id="world-map" class="world-map" role="group" tabindex="0" aria-label="International activity map" aria-describedby="map-help"></svg><div class="map-controls"><button data-zoom="in" aria-label="Zoom in">${icon("plus")}</button><button data-zoom="out" aria-label="Zoom out">${icon("minus")}</button><button data-zoom="reset">Reset view</button><button data-fullscreen aria-label="Expand map" aria-pressed="false">${icon("maximize")}</button></div><div class="map-legend">${legend()}</div><span class="pan-hint">${icon("move")}Drag to pan</span><div id="map-selection"></div><div class="map-attribution"><a href="${url("assets/MAP-SOURCES.md")}">Approximate locations · Natural Earth</a></div></section></div>`;
  drawMap();
  countryPanel();
  renderMapSelection();
}
function legend() {
  return `<details class="legend"><summary>Legend${icon("chevron-down")}</summary><div class="legend-content"><h3>Activity type</h3><div class="legend-grid">${Object.entries(
    TACTICS,
  )
    .map(
      ([k, v]) =>
        `<span><i class="tactic-dot" style="background:${COLORS[k]}"></i>${v}</span>`,
    )
    .join(
      "",
    )}</div><h3>Status</h3><div class="legend-grid">${STATUSES.map((s) => `<span><svg viewBox="-9 -9 18 18" width="18" height="18" aria-hidden="true"><path d="${shape(s, 6)}" fill="${s === "Closed/exited" ? "none" : "#536b73"}" stroke="#536b73" stroke-width="1.5"/></svg>${e(STATUS_LABELS[s] || s)}</span>`).join("")}</div><p>Pins show activity type; shapes show lifecycle. Shading follows matching results. Unknown status does not mean inactive.</p></div></details>`;
}
function countryPanel() {
  const panel = document.querySelector("#country-panel");
  if (!panel || !state.country) return;
  const rows = records.filter((r) => r.country === state.country);
  panel.innerHTML = `<details class="country-overview"><summary>All inventory records in ${e(state.country)} (${rows.length}); ignores other filters${icon("chevron-down")}</summary>${activityRows(rows, { country: true })}</details>`;
}
function replaceRecordURL() {
  history.replaceState(
    null,
    "",
    location.pathname + (stateQuery(state) ? "?" + stateQuery(state) : ""),
  );
}
function selectMapRecord(id, { focus = false } = {}) {
  const r = visible.find((r) => r.id === id);
  if (!r) return;
  state.record = id;
  replaceRecordURL();
  renderMapSelection();
  const loc = world && places ? locationOf(r) : null;
  if (loc) setCamera(revealPoint(currentCamera(), loc.xy, mapAspect()));
  if (focus)
    main.querySelector(".selection-card")?.focus({ preventScroll: true });
}

function bindCopy(root = main) {
  root.querySelectorAll("[data-copy]:not([data-copy-bound])").forEach((n) => {
    n.dataset.copyBound = "true";
    n.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        toast("View link copied");
      } catch {
        toast("Copy this page’s address to share the view");
      }
    });
  });
}
function renderMapSelection() {
  const host = document.querySelector("#map-selection");
  if (!host) return;
  const r = visible.find((r) => r.id === state.record);
  main.querySelectorAll(".activity-row").forEach((n) => {
    const selected = n.dataset.record === r?.id;
    n.classList.toggle("selected", selected);
    n.setAttribute("aria-pressed", String(selected));
  });
  main.querySelectorAll("[data-map-record]").forEach((n) => {
    n.classList.toggle("selected", n.dataset.mapRecord === r?.id);
    n.setAttribute("aria-pressed", String(n.dataset.mapRecord === r?.id));
  });
  if (!r) {
    host.innerHTML = "";
    return;
  }
  host.innerHTML = `<article class="selection-card" tabindex="-1" aria-label="Selected activity"><button class="close" data-dismiss-selection aria-label="Close selection">${icon("x")}</button><div class="eyebrow">${e(r.id)} · ${e(r.country)}</div><h2>${e(r.headline)}</h2><p>${e(r.institution)}</p><p>${e(r.partner)}</p><p class="small">${e(r.city ? r.city + ", " + r.country : r.country + " · country-level location")} · Approximate location</p>${recordDetail(r, { fmt, compact: true })}<div class="selection-actions"><button data-selection-details>Full evidence</button><button data-copy>Copy link</button><a href="${url("markets/?country=" + encodeURIComponent(r.country))}">Country brief</a></div></article>`;
  host
    .querySelector("[data-dismiss-selection]")
    .addEventListener("click", () => {
      const mapOnly =
          main.querySelector(".map-canvas.expanded") ||
          getComputedStyle(main.querySelector(".activity-pane")).display ===
            "none",
        target = mapOnly
          ? [...main.querySelectorAll("[data-map-record]")].find(
              (n) => n.dataset.mapRecord === r.id,
            )
          : [
              ...main.querySelectorAll(
                ".activity-pane > .activity-list .activity-row",
              ),
            ].find((n) => n.dataset.record === r.id);
      (target || main.querySelector("[data-fullscreen]"))?.focus();
      state.record = "";
      replaceRecordURL();
      renderMapSelection();
    });
  host
    .querySelector("[data-selection-details]")
    .addEventListener("click", () =>
      showRecord(r.id, { update: false, modal: true }),
    );
  bindCopy(host);
}
const aliases = {
  "The Bahamas": "Bahamas",
  "United States of America": "United States",
  "United Kingdom": "United Kingdom",
  "Republic of Serbia": "Serbia",
  "United Republic of Tanzania": "Tanzania",
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "South Korea": "South Korea",
  "Republic of Korea": "South Korea",
};
async function geo() {
  if (!world) {
    [world, places] = await Promise.all([
      get("assets/world.geojson"),
      get("assets/places.json"),
    ]);
  }
  return world;
}
function locationOf(r) {
  const city = places.cities?.[`${r.city}|${r.country}`],
    country = places.countries?.[r.country],
    feature = world.features.find(
      (f) => (aliases[f.properties.name] || f.properties.name) === r.country,
    );
  const p =
    city ||
    country ||
    (feature ? [feature.properties.lon, feature.properties.lat] : null);
  return p
    ? {
        xy: project(p[0], p[1]),
        scope: city ? "Approximate city locator" : "Country-level locator",
      }
    : null;
}
function geoPath(f) {
  const polys =
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
  return polys
    .map((poly) =>
      poly
        .map((ring) => {
          let d = "",
            last;
          for (const p of ring) {
            const [x, y] = project(...p);
            if (!last || Math.abs(p[0] - last[0]) > 180)
              d += `M${x.toFixed(1)},${y.toFixed(1)}`;
            else d += `L${x.toFixed(1)},${y.toFixed(1)}`;
            last = p;
          }
          return d + "Z";
        })
        .join(""),
    )
    .join("");
}
function shape(status, s) {
  if (status === "Announced") return `M0,${-s} L${s},${s} L${-s},${s}Z`;
  if (status === "In development")
    return `M${-s},${-s}h${2 * s}v${2 * s}h${-2 * s}Z`;
  if (status === "Suspended/restructured")
    return `M0,${-s}L${s},0L0,${s}L${-s},0Z`;
  if (status === "Closed/exited")
    return `M${-s},${-s}L${s},${s}M${s},${-s}L${-s},${s}`;
  if (status === "Unknown")
    return (
      Array.from(
        { length: 6 },
        (_, i) =>
          `${i ? "L" : "M"}${Math.cos((i * Math.PI) / 3) * s},${Math.sin((i * Math.PI) / 3) * s}`,
      ).join("") + "Z"
    );
  return `M${-s},0a${s},${s} 0 1,0 ${s * 2},0a${s},${s} 0 1,0 ${-s * 2},0`;
}
function currentCamera() {
  return { x: mapCenter[0], y: mapCenter[1], zoom: mapZoom };
}
function setCamera(c) {
  c = constrain(c);
  mapCenter = [c.x, c.y];
  mapZoom = c.zoom;
  updateMapView();
}
function mapAspect() {
  const svg = main.querySelector("#world-map"),
    b = svg?.getBoundingClientRect();
  return b?.height ? b.width / b.height : 2;
}
function updateMapView() {
  const svg = main.querySelector("#world-map");
  if (!svg) return;
  const w = 1000 / mapZoom,
    h = w / mapAspect();
  svg.setAttribute(
    "viewBox",
    `${mapCenter[0] - w / 2} ${mapCenter[1] - h / 2} ${w} ${h}`,
  );
  const unit = 1 / (svg.getScreenCTM()?.a || 1),
    pins = [...svg.querySelectorAll("[data-map-record]")],
    points = pins.map((n) => [Number(n.dataset.x), Number(n.dataset.y)]),
    placed = spreadPoints(points, unit);
  pins.forEach((n, i) => {
    const [x, y] = placed[i],
      ox = points[i][0],
      oy = points[i][1];
    n.querySelector(".pin-marker").setAttribute(
      "transform",
      `translate(${x} ${y}) scale(${unit})`,
    );
    n.querySelector(".pin-leader").setAttribute(
      "d",
      Math.hypot(x - ox, y - oy) > 1 ? `M${ox},${oy}L${x},${y}` : "",
    );
  });
}
async function drawMap() {
  const svg = main.querySelector("#world-map");
  if (!svg) return;
  try {
    await geo();
    if (!svg.isConnected) return;
    const profile = isProfile(),
      recorded = new Set(visible.map((r) => r.country)),
      labels = new Set(),
      showLabels = new Set(visible.map((r) => r.country)).size <= 8;
    let html =
      "<title>International healthcare activity</title><desc>Approximate city and country locations. Every pin is also available in the activity list.</desc>" +
      world.features
        .map((f) => {
          const n = aliases[f.properties.name] || f.properties.name;
          return `<path class="land ${recorded.has(n) ? "has-records" : ""} ${state.country === n ? "chosen" : ""}" d="${geoPath(f)}" data-country="${e(n)}"><title>${e(n)}</title></path>`;
        })
        .join("");
    for (const r of visible) {
      const loc = locationOf(r);
      if (!loc) continue;
      const [x, y] = loc.xy,
        showLabel =
          (showLabels || (profile && r.tactic_primary === "T1" && r.city)) &&
          !labels.has(r.country);
      labels.add(r.country);
      html += `<g class="pin ${r.status === "Unknown" ? "unknown" : ""} ${state.record === r.id ? "selected" : ""}" tabindex="-1" role="button" aria-pressed="${state.record === r.id}" aria-label="${e(r.institution + "; " + r.partner + "; " + r.country + "; " + TACTICS[r.tactic_primary] + "; " + statusLabel(r))}" data-map-record="${e(r.id)}" data-x="${x}" data-y="${y}"><title>${e(r.headline + " · " + loc.scope)}</title><path class="pin-leader" stroke="#7b9298" stroke-width="1" vector-effect="non-scaling-stroke"/><g class="pin-marker"><circle class="pin-halo" r="12"/><circle r="22" fill="transparent"/><path class="pin-shape" d="${profile ? profileSymbol(r.tactic_primary) : shape(r.status, 6)}" fill="${r.status === "Closed/exited" ? "none" : (profile ? PROFILE_COLORS : COLORS)[r.tactic_primary]}" style="${r.status === "Closed/exited" ? "stroke:" + COLORS[r.tactic_primary] : ""}"/>${showLabel ? `<text class="location-label" x="13" y="5">${e(profile && r.city ? r.city : r.country)}</text>` : ""}</g></g>`;
    }
    svg.innerHTML = html;
    const points = visible
      .map(locationOf)
      .filter(Boolean)
      .map((l) => l.xy);
    if (
      (state.country ||
        (profile ? state.region || state.tactic : state.institution.length)) &&
      mapZoom === 1
    ) {
      const c = fitPoints(points, mapAspect());
      mapCenter = [c.x, c.y];
      mapZoom = c.zoom;
    }
    updateMapView();
    bindMapGestures(svg);
  } catch (err) {
    svg.outerHTML = profileMapError();
    console.error(err);
  }
}
function profileMapError() {
  return isProfile()
    ? '<p class="notice">Map unavailable. Choose List above to inspect every matching record.</p>'
    : '<p class="notice">Map unavailable. All records remain available in the activity list.</p>';
}
function bindMapGestures(svg) {
  mapCleanup();
  const pointers = new Map();
  let gesture = null,
    moved = false,
    clickTarget = null;
  const worldPoint = (x, y) => {
    const b = svg.getBoundingClientRect(),
      c = currentCamera(),
      w = 1000 / c.zoom,
      h = w / mapAspect();
    return {
      x: c.x + ((x - b.left) / b.width - 0.5) * w,
      y: c.y + ((y - b.top) / b.height - 0.5) * h,
    };
  };
  const begin = () => {
    const ps = [...pointers.values()];
    if (ps.length === 1) {
      gesture = { camera: currentCamera(), x: ps[0].x, y: ps[0].y };
    } else if (ps.length >= 2) {
      const [a, b] = ps;
      gesture = {
        camera: currentCamera(),
        distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        anchor: worldPoint((a.x + b.x) / 2, (a.y + b.y) / 2),
      };
    }
  };
  svg.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType !== "touch") return;
    if (pointers.size === 0) {
      moved = false;
      clickTarget = ev.target;
    }
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    svg.setPointerCapture(ev.pointerId);
    begin();
  });
  svg.addEventListener("pointermove", (ev) => {
    if (!pointers.has(ev.pointerId) || !gesture) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const ps = [...pointers.values()],
      b = svg.getBoundingClientRect();
    if (ps.length >= 2 && gesture.distance) {
      const [a, z] = ps,
        mid = { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 },
        distance = Math.hypot(a.x - z.x, a.y - z.y),
        c = zoomAt(gesture.camera, distance / gesture.distance, gesture.anchor),
        w = 1000 / c.zoom;
      setCamera(
        panBy(
          c,
          (-(mid.x - gesture.mid.x) * w) / b.width,
          (-(mid.y - gesture.mid.y) * w) / b.width,
        ),
      );
      moved = true;
    } else if (ps.length === 1 && !gesture.distance) {
      const dx = ps[0].x - gesture.x,
        dy = ps[0].y - gesture.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      if (moved) {
        svg.classList.add("dragging");
        const w = 1000 / gesture.camera.zoom;
        setCamera(
          panBy(gesture.camera, (-dx * w) / b.width, (-dy * w) / b.width),
        );
      }
    }
  });
  const end = (ev) => {
    pointers.delete(ev.pointerId);
    if (pointers.size) begin();
    else {
      gesture = null;
      svg.classList.remove("dragging");
    }
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  svg.addEventListener("click", (ev) => {
    if (moved) {
      moved = false;
      clickTarget = null;
      return;
    }
    const target = clickTarget || ev.target;
    clickTarget = null;
    const pin = target.closest("[data-map-record]");
    if (pin) {
      if (isProfile()) showRecord(pin.dataset.mapRecord);
      else selectMapRecord(pin.dataset.mapRecord);
      return;
    }
    const country = target.closest("[data-country]")?.dataset.country;
    if (country && records.some((r) => r.country === country)) {
      mapZoom = 1;
      change({ country, record: "" });
    }
  });
  svg.addEventListener(
    "wheel",
    (ev) => {
      if (
        !ev.ctrlKey &&
        !ev.metaKey &&
        !svg.closest(".expanded") &&
        document.activeElement !== svg &&
        !svg.contains(document.activeElement)
      )
        return;
      ev.preventDefault();
      setCamera(
        zoomAt(
          currentCamera(),
          Math.exp(-Math.max(-80, Math.min(80, ev.deltaY)) * 0.003),
          worldPoint(ev.clientX, ev.clientY),
        ),
      );
    },
    { passive: false },
  );
  svg.addEventListener("keydown", (ev) => {
    const pin = ev.target.closest("[data-map-record]");
    const pins = [...svg.querySelectorAll("[data-map-record]")];
    if (
      pin &&
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(ev.key)
    ) {
      ev.preventDefault();
      const index = pins.indexOf(pin),
        next =
          ev.key === "Home"
            ? 0
            : ev.key === "End"
              ? pins.length - 1
              : (index +
                  (["ArrowRight", "ArrowDown"].includes(ev.key) ? 1 : -1) +
                  pins.length) %
                pins.length;
      pins[next]?.focus();
      const n = pins[next];
      if (n)
        setCamera(
          revealPoint(
            currentCamera(),
            [Number(n.dataset.x), Number(n.dataset.y)],
            mapAspect(),
          ),
        );
      return;
    }
    if (!pin && ev.key === "Enter" && pins.length) {
      ev.preventDefault();
      pins[0].focus();
      return;
    }
    if (ev.key === "Escape" && pin) {
      ev.preventDefault();
      svg.focus();
      state.record = "";
      replaceRecordURL();
      renderMapSelection();
      return;
    }
    if (pin && ["Enter", " "].includes(ev.key)) {
      ev.preventDefault();
      if (isProfile()) showRecord(pin.dataset.mapRecord);
      else selectMapRecord(pin.dataset.mapRecord, { focus: true });
      return;
    }
    const pan = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[ev.key];
    if (pan) {
      ev.preventDefault();
      setCamera(
        panBy(
          currentCamera(),
          (pan[0] * 80) / mapZoom,
          (pan[1] * 80) / mapZoom,
        ),
      );
    } else if (["+", "=", "-", "_", "Home"].includes(ev.key)) {
      ev.preventDefault();
      setCamera(
        ev.key === "Home"
          ? HOME
          : zoomAt(
              currentCamera(),
              ["+", "="].includes(ev.key) ? 1.5 : 1 / 1.5,
            ),
      );
    } else if (ev.key === "Escape") {
      state.record = "";
      replaceRecordURL();
      renderMapSelection();
    }
  });
  const resize = () => updateMapView(),
    observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  observer?.observe(svg);
  window.addEventListener("resize", resize);
  mapCleanup = () => {
    observer?.disconnect();
    window.removeEventListener("resize", resize);
  };
}
async function drawMini(id, rows) {
  const node = document.getElementById(id);
  if (!node) return;
  try {
    await geo();
    if (!node.isConnected) return;
    const dots = rows
      .map((r) => {
        const l = locationOf(r);
        return l
          ? `<circle cx="${l.xy[0]}" cy="${l.xy[1]}" r="3.3" fill="${COLORS[r.tactic_primary]}" opacity=".8"/>`
          : "";
      })
      .join("");
    node.innerHTML = `<svg viewBox="0 0 1000 430" role="img" aria-label="${rows.length} seeded records around the world"><g>${world.features.map((f) => `<path class="land" d="${geoPath(f)}"/>`).join("")}${dots}</g></svg>`;
  } catch {
    node.innerHTML =
      '<p class="small muted">Explore the complete location list in the tracker.</p>';
  }
}

function briefSources(rows) {
  return printSources(rows, { data, state, fmt });
}
function pageContext() {
  return {
    records,
    names,
    state,
    coverage,
    data,
    fmt,
    url,
    heading,
    filters,
    resultBar,
    table,
    empty,
    briefSources,
  };
}
function renderCoverage() {
  visible = [];
  main.innerHTML = coveragePage(pageContext());
}
function renderMarkets() {
  visible = state.country ? filterRecords(records, state) : [];
  main.innerHTML = marketsPage(pageContext());
}
function renderCompare() {
  visible = filterRecords(records, state);
  main.innerHTML = comparePage(pageContext());
}
function renderUpdates() {
  visible = [];
  main.innerHTML =
    heading(
      "Publication history",
      "Updates",
      "Reader releases and editorial editions are different. A reader release does not imply that a new source scan was completed.",
    ) +
    `<section class="prose"><h2>Reader ${e(data.reader_version)}</h2><p>Lifecycle is separate from initial-inventory history. The reader adds clearer activity summaries, country briefs, institution comparisons and exports that preserve evidence scope. The source inventory remains checked as of ${e(fmt(data.generated_as_of))}.</p><p><a href="${url("coverage/")}">Read coverage limits</a> · <a href="https://github.com/rabookire/international-healthcare-brief/commits/main/">Repository change history</a></p><h2>Editorial editions</h2>${editions.length ? '<div id="edition-list"></div>' : "<p>No edition has been published. This is not a claim that a scan found no news. Historical activity is available in the inventory.</p>"}<p><a href="${url("briefs/")}">Brief archive</a></p></section>`;
  if (editions.length)
    renderEditionList(main.querySelector("#edition-list"), editions);
}
function renderInstitutions() {
  document.body.classList.remove("institution-profile");
  const selected =
    state.institution.length === 1 && names.includes(state.institution[0])
      ? state.institution[0]
      : null;
  if (!selected) {
    visible = [];
    main.innerHTML =
      heading(
        "Listed U.S. health systems",
        "Institutions",
        "Explore documented activity and evidence coverage. Counts describe this inventory, not competitive scale.",
        `<a class="button" href="${url("compare/")}">Compare institutions</a>`,
      ) +
      `<div class="institution-grid">${names
        .map((n) => {
          const rows = records.filter((r) => institutionsOf(r).includes(n));
          return `<a class="institution-card" href="${instLink(n)}"><h2>${e(n)}</h2><p>${rows.length} documented records · ${new Set(rows.map((r) => r.country)).size} countries${rows.length ? "" : " · Coverage gap"}</p></a>`;
        })
        .join("")}</div>`;
    return;
  }
  const rows = records.filter((r) => institutionsOf(r).includes(selected)),
    note = coverage.find((x) => x.institution === selected);
  document.body.classList.add("institution-profile");
  visible = filterRecords(rows, state);
  main.innerHTML =
    renderProfile({ selected, rows, visible, state, note, fmt, url, icon }) +
    activeFilters() +
    scopeNotice() +
    `<p class="notice">${rows.filter((r) => r.status === "Unknown").length} of ${rows.length} inventory records have status not established. Record counts do not measure patient volumes, investment or market share. Missing records do not establish an absence of activity. <a href="${url("coverage/")}">Coverage and open questions</a> · <a href="${url("compare/?institution=" + encodeURIComponent(selected))}">Add to comparison</a></p>` +
    resultBar(visible, "map/") +
    briefSources(visible);
  if (visible.length && state.view === "map") drawMap();
}
function renderEditionList(node, items) {
  node.innerHTML = items
    .map(
      (ed) =>
        `<article><div class="eyebrow">${e(fmt(ed.date))}</div><h2><a href="${url("briefs/?edition=" + ed.date)}">${e(ed.title || ed.headline || "Daily intelligence brief")}</a></h2><p class="small muted">${e((ed.record_ids || ed.records || []).join(" · "))}</p><a class="small" href="${url("briefs/" + ed.date + ".md")}">Read source edition ↗</a></article>`,
    )
    .join("");
}
async function renderBriefs() {
  const edition = new URLSearchParams(location.search).get("edition");
  if (
    edition &&
    /^\d{4}-\d{2}-\d{2}$/.test(edition) &&
    editions.some((x) => x.date === edition)
  ) {
    main.innerHTML = '<div class="loading">Loading edition…</div>';
    try {
      const response = await fetch(url("briefs/" + edition + ".md"));
      if (!response.ok) throw Error("edition");
      main.innerHTML = `<article class="prose"><a href="${url("briefs/")}">← Brief archive</a>${parseMarkdown(await response.text(), url("briefs/" + edition + ".md"))}</article>`;
    } catch {
      main.innerHTML =
        '<p class="notice">The edition could not load. <a href="' +
        url("briefs/") +
        '">Return to archive</a>.</p>';
    }
    return;
  }
  const result = filterEditions(editions, records, state);
  main.innerHTML =
    heading("", "Briefs", "") +
    (editions.length ? filters({ archive: true }) : "") +
    `<p class="small muted" role="status">${result.length} editions · Tracker: ${records.length} sourced records</p><section id="edition-list"></section>`;
  const node = document.querySelector("#edition-list");
  if (result.length) renderEditionList(node, result);
  else
    node.innerHTML = `<div class="empty-state"><h2>${editions.length ? "No editions match these filters" : "No edition published yet"}</h2><p>${editions.length ? "Try a broader date range or filter selection." : "The tracker is available to explore."}</p><a class="button" href="${url("data/")}">Explore the tracker ↗</a></div>`;
}
async function renderMethodology() {
  main.innerHTML = '<p class="loading">Loading methodology…</p>';
  try {
    const r = await fetch(url("METHODOLOGY.md"));
    if (!r.ok) throw Error("methodology");
    main.innerHTML = `<article class="prose">${parseMarkdown(await r.text(), url("METHODOLOGY.md"))}</article>`;
  } catch {
    main.innerHTML =
      '<p class="notice">The methodology could not load. <a href="' +
      url("METHODOLOGY.md") +
      '">Open the source document</a>.</p>';
  }
}

function showRecord(id, { update = true, modal = false } = {}) {
  const r = records.find((x) => x.id === id);
  if (!r) return;
  if (isWorkspace() && !modal && visible.some((x) => x.id === id)) {
    selectMapRecord(id, { focus: true });
    return;
  }
  if (update) {
    state.record = id;
    replaceRecordURL();
  }
  dialog.innerHTML = `<div class="modal-head"><div><div class="eyebrow">${e(r.id)} · ${e(r.country)}</div><h2 id="dialog-title">${e(r.headline)}</h2></div><button class="close" aria-label="Close record" data-close>${icon("x")}</button></div><p>${e(r.institution)} · ${e(r.partner)}</p>${recordDetail(r, { fmt })}<div class="selection-actions"><button data-copy>Copy record link</button><a href="${url("markets/?country=" + encodeURIComponent(r.country))}">Country brief</a></div>`;
  dialog
    .querySelector("[data-close]")
    .addEventListener("click", () => dialog.close());
  bindCopy(dialog);
  if (!dialog.open) dialog.showModal();
}
dialog.addEventListener("close", () => {
  if (
    state.record &&
    (!isWorkspace() || !visible.some((r) => r.id === state.record))
  ) {
    state.record = "";
    history.replaceState(
      null,
      "",
      location.pathname + (stateQuery(state) ? "?" + stateQuery(state) : ""),
    );
  }
});
dialog.addEventListener("click", (ev) => {
  if (ev.target === dialog) {
    const b = dialog.getBoundingClientRect();
    if (
      ev.clientX < b.left ||
      ev.clientX > b.right ||
      ev.clientY < b.top ||
      ev.clientY > b.bottom
    )
      dialog.close();
  }
});
function toast(text) {
  const n = document.querySelector("#toast");
  n.textContent = text;
  n.hidden = false;
  setTimeout(() => (n.hidden = true), 2500);
}
function setExpanded(expanded) {
  const canvas = main.querySelector(".map-canvas");
  if (!canvas) return;
  canvas.classList.toggle("expanded", expanded);
  document.body.classList.toggle("map-expanded", expanded);
  for (const n of [
    document.querySelector(".skip"),
    document.querySelector("#header"),
    document.querySelector("#footer"),
    main.querySelector(".workspace-heading"),
    main.querySelector(".activity-pane"),
  ]) {
    if (n) n.inert = expanded;
  }
  if (expanded) {
    canvas.setAttribute("role", "dialog");
    canvas.setAttribute("aria-modal", "true");
  } else {
    canvas.removeAttribute("role");
    canvas.removeAttribute("aria-modal");
  }
  const button = canvas.querySelector("[data-fullscreen]");
  button.setAttribute("aria-pressed", String(expanded));
  button.setAttribute("aria-label", expanded ? "Collapse map" : "Expand map");
  button.innerHTML = icon(expanded ? "minimize" : "maximize");
  button.focus();
  updateMapView();
}
function bind() {
  main.querySelectorAll("[data-profile-view]").forEach((n) =>
    n.addEventListener("click", () => {
      change({ view: n.dataset.profileView, record: "" });
      main.querySelector(`[data-profile-view="${state.view}"]`)?.focus();
    }),
  );
  main.querySelectorAll("[data-profile-reset]").forEach((n) =>
    n.addEventListener("click", () => {
      const institution = state.institution,
        view = state.view;
      mapZoom = 1;
      mapCenter = [500, 220];
      change({ ...readState("", stateOptions), institution, view });
      main.querySelector('[data-filter="region"]')?.focus();
    }),
  );
  main
    .querySelectorAll("[data-record]")
    .forEach((n) =>
      n.addEventListener("click", () => showRecord(n.dataset.record)),
    );
  main.querySelectorAll("[data-institution]").forEach((n) =>
    n.addEventListener("change", () => {
      const institutions = [
        ...main.querySelectorAll("[data-institution]:checked"),
      ].map((x) => x.dataset.institution);
      const open = main.querySelector(".institutions-filter")?.open;
      change({ institution: institutions, record: "" });
      if (open) {
        main.querySelector(".institutions-filter")?.setAttribute("open", "");
        [...main.querySelectorAll("[data-institution]")]
          .find((x) => x.dataset.institution === n.dataset.institution)
          ?.focus();
      }
    }),
  );
  main
    .querySelectorAll("[data-filter]")
    .forEach((n) =>
      n.addEventListener("change", () =>
        change({ [n.dataset.filter]: n.value, record: "" }),
      ),
    );
  main
    .querySelectorAll("[data-footprint]")
    .forEach((n) =>
      n.addEventListener("click", () =>
        change({ footprint: n.dataset.footprint, record: "" }),
      ),
    );
  main.querySelectorAll("[data-reset]").forEach((n) =>
    n.addEventListener("click", () => {
      mapZoom = 1;
      mapCenter = [500, 220];
      change(readState("", stateOptions));
    }),
  );
  const search = main.querySelector("#record-search");
  if (search)
    search.addEventListener("input", () => {
      const pos = search.selectionStart;
      change({ q: search.value, record: "" }, true);
      const n = main.querySelector("#record-search");
      n.focus();
      if (n.type === "search") n.setSelectionRange(pos, pos);
    });
  main.querySelectorAll("[data-sort]").forEach((n) =>
    n.addEventListener("click", () => {
      if (sortKey === n.dataset.sort) sortDir *= -1;
      else {
        sortKey = n.dataset.sort;
        sortDir = 1;
      }
      const key = n.dataset.sort;
      render();
      main.querySelector(`[data-sort="${key}"]`)?.focus();
    }),
  );
  main.querySelector("[data-download]")?.addEventListener("click", () => {
    const blob = new Blob(
        [
          "\uFEFF" +
            csvExport(visible, {
              inventory_as_of: data.generated_as_of,
              reader_version: data.reader_version,
              source_sha256: data.source_sha256,
              filters: state,
            }),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ihb-filtered-tracker.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  });
  bindCopy();
  main
    .querySelectorAll("[data-zoom]")
    .forEach((n) =>
      n.addEventListener("click", () =>
        setCamera(
          n.dataset.zoom === "reset"
            ? HOME
            : zoomAt(currentCamera(), n.dataset.zoom === "in" ? 1.6 : 1 / 1.6),
        ),
      ),
    );

  main
    .querySelectorAll("[data-view]")
    .forEach((n) =>
      n.addEventListener("click", () => change({ view: n.dataset.view })),
    );
  main.querySelectorAll("[data-remove-key]").forEach((n) =>
    n.addEventListener("click", () => {
      const key = n.dataset.removeKey;
      change({
        [key]:
          key === "institution"
            ? state.institution.filter((x) => x !== n.dataset.removeValue)
            : key === "footprint"
              ? "all"
              : "",
        record: "",
      });
    }),
  );
  main
    .querySelectorAll("[data-print]")
    .forEach((n) => n.addEventListener("click", () => window.print()));
  const more = main.querySelector(".more-filters");
  more?.addEventListener("toggle", () => {
    moreFiltersOpen = more.open;
  });
  main
    .querySelector("[data-clear-institutions]")
    ?.addEventListener("click", () => change({ institution: [], record: "" }));
  main
    .querySelector("[data-fullscreen]")
    ?.addEventListener("click", () =>
      setExpanded(
        !main.querySelector(".map-canvas").classList.contains("expanded"),
      ),
    );
}

function render() {
  if (!data) return;
  if (main.querySelector(".map-canvas.expanded")) setExpanded(false);
  mapCleanup();
  switch (page) {
    case "home":
      renderHome();
      break;
    case "map":
      renderMap();
      break;
    case "tracker":
      renderTracker();
      break;
    case "institutions":
      renderInstitutions();
      break;
    case "briefs":
      renderBriefs();
      break;
    case "methodology":
      renderMethodology();
      break;
    case "coverage":
      renderCoverage();
      break;
    case "markets":
      renderMarkets();
      break;
    case "compare":
      renderCompare();
      break;
    case "updates":
      renderUpdates();
      break;
  }
  bind();
  if (
    state.record &&
    !dialog.open &&
    (!isWorkspace() || !visible.some((r) => r.id === state.record))
  )
    showRecord(state.record, { update: false, modal: true });
}
window.addEventListener("keydown", (ev) => {
  if (dialog.open) return;
  const canvas = main.querySelector(".map-canvas.expanded");
  if (canvas && ev.key === "Tab") {
    const focusable = [
      ...canvas.querySelectorAll('button,a[href],[tabindex="0"],summary'),
    ].filter(
      (n) =>
        n.getClientRects().length &&
        (!n.closest("details") ||
          n.closest("details").open ||
          n.tagName === "SUMMARY"),
    );
    const first = focusable[0],
      last = focusable.at(-1);
    if (!canvas.contains(document.activeElement)) {
      ev.preventDefault();
      (ev.shiftKey ? last : first)?.focus();
    } else if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last?.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first?.focus();
    }
  }
  if (ev.key !== "Escape") return;
  if (canvas) setExpanded(false);
  main.querySelectorAll(".workspace-filters details[open]").forEach((n) => {
    n.open = false;
    n.querySelector("summary")?.focus();
  });
});

shell();
if (page === "methodology") {
  await renderMethodology();
} else {
  try {
    [data, names] = await Promise.all([
      get("data/tracker.json"),
      get("data/institutions.json"),
    ]);
    records = data.records;
    if (["institutions", "coverage"].includes(page))
      coverage = await get("data/coverage.json");
    if (["briefs", "updates"].includes(page)) {
      const briefData = await get("data/briefs.json");
      editions = (briefData.editions || []).sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    }
    document.querySelector("#as-of").textContent =
      "Source inventory checked " +
      fmt(data.generated_as_of) +
      " · Reader " +
      data.reader_version;
    render();
  } catch (err) {
    main.innerHTML = `<div class="empty-state"><h1>The inventory could not load</h1><p>Refresh to try again, or use the source files below. A loading failure does not mean there are no records.</p><a class="button" href="${url("data/tracker.md")}">Read the complete tracker</a> <a class="button" href="${url("data/tracker.csv")}">Download canonical CSV</a> <a class="button" href="${url("methodology/")}">About &amp; sources</a></div>`;
    console.error(err);
  }
}
