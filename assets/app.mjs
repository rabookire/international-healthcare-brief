import {
  relationshipName,
  activityCollection,
  developmentList,
  comparisonLink,
} from "./presentation.mjs";
import {
  HOME,
  constrain,
  zoomAt,
  panBy,
  fitPoints,
  clusterPoints,
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
  countriesOf,
  isCurrentRecord,
  currentState,
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
const currentReader = [
  "home",
  "map",
  "tracker",
  "institutions",
  "markets",
  "compare",
].includes(page);
const readerState = (query = "", options = stateOptions) =>
  currentReader
    ? currentState(readState(query, options))
    : readState(query, options);
let allRecords = [],
  compareSlots = 2,
  compareChoices = null,
  marketSelected = [],
  mapGroups = [],
  selectedMarket = "";
let data,
  records = [],
  names = [],
  coverage = [],
  editions = [],
  world,
  places,
  state = readerState(location.search, stateOptions),
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
  document.body.classList.toggle("current-reader", currentReader);
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
    `<footer class="app-footer"><span id="as-of" hidden></span><a href="${url("methodology/")}">About &amp; sources</a></footer>`;
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
  if (page === "markets" && ("country" in patch || "region" in patch))
    marketSelected = [];
  const q = stateQuery(state);
  history[replace ? "replaceState" : "pushState"](
    null,
    "",
    location.pathname + (q ? "?" + q : ""),
  );
  selectedMarket = "";
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
  state = readerState(location.search, stateOptions);
  compareChoices = null;
  selectedMarket = "";
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
  const chips = filterChips(state, TACTICS).filter(
    (c) => page !== "compare" || c.key !== "institution",
  );
  return chips.length
    ? `<div class="active-filters" aria-label="Active filters">${chips.map((c) => `<button data-remove-key="${e(c.key)}" data-remove-value="${e(c.value)}" aria-label="Remove filter: ${e(c.label)}">${e(c.label)} <span aria-hidden="true">×</span></button>`).join("")}</div>`
    : "";
}

function scopeNotice() {
  return "";
}
function filters({ archive = false, omitInstitution = false } = {}) {
  const countries = [
    ...new Set(
      [
        ...records.flatMap(countriesOf),
        ...(archive
          ? editions.flatMap((ed) => [
              ...(ed.countries || []),
              ...(ed.items || []).map((i) => i.country).filter(Boolean),
            ])
          : []),
        state.country,
      ].filter(Boolean),
    ),
  ].sort();
  return `<section class="filter-panel reader-filters" aria-label="Filter records"><div class="workspace-filters">${omitInstitution ? "" : institutionControl()}${selectField("country", "Country", countries)}${selectField("region", "Region", REGIONS)}${selectField("tactic", "Activity type", Object.entries(TACTICS))}<label class="results-search reader-search">${icon("search")}<span class="sr-only">Search records</span><input id="record-search" type="search" placeholder="Search activities" value="${e(state.q)}"></label><button class="clear-filters" data-reset>Clear filters</button></div>${archive ? `<div class="archive-dates"><label>From <input type="date" data-filter="from" value="${e(state.from)}"></label><label>To <input type="date" data-filter="to" value="${e(state.to)}"></label></div>` : ""}</section>${activeFilters()}`;
}

function table(rows) {
  const columns = [
    ["headline", "Activity"],
    ["institution", "Institution"],
    ["country", "Location"],
    ["tactic_primary", "Activity type"],
    ["latest_event_date", "Latest event"],
  ];
  return `<div class="table-wrap"><table><caption class="small muted">${rows.length} matching activities.</caption><thead><tr>${columns.map(([key, label]) => `<th scope="col" ${sortKey === key ? `aria-sort="${sortDir === 1 ? "ascending" : "descending"}"` : ""}><button data-sort="${key}">${label}${sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead><tbody>${sortRecords(
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
          )}</td><td>${e(r.country)}<small>${e(r.city || "Country-level location")} · ${e(regionText(r.region))}</small></td><td>${e(TACTICS[r.tactic_primary])}${r.tactic_secondary?.length ? `<small>Also: ${e(r.tactic_secondary.map((t) => TACTICS[t]).join("; "))}</small>` : ""}</td><td>${e(fmt(eventKey(r)))}<small>Source checked ${e(fmt(r.last_verified))}</small></td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function resultBar(rows, target) {
  return `<div class="result-bar"><span role="status">${rows.length} matching activities</span><div class="result-tools"><a class="button" href="${url(target + "?" + stateQuery(state))}">${target === "map/" ? "Map & list" : "Table"}</a><button data-download>Export CSV</button></div></div>`;
}
function empty() {
  return '<div class="empty-state"><h2>No verified current records for these filters</h2><button data-reset>Reset filters</button></div>';
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
  return filters();
}
function activityRows(rows) {
  return `<ul class="activity-list">${rows
    .map((r) => {
      const matched = secondaryMatch(r, state, TACTICS);
      return `<li><button class="activity-row ${state.record === r.id ? "selected" : ""}" data-record="${e(r.id)}" aria-pressed="${state.record === r.id}"><span class="activity-main"><span class="activity-country">${e(r.institution)} · ${e(state.country || r.country)}</span><strong>${e(relationshipName(r))}</strong><span class="activity-type">${e(TACTICS[r.tactic_primary])}</span>${matched ? `<span class="matched-tag">${e(matched)}</span>` : ""}${r.facility_status && ["Planned", "Under construction"].includes(r.facility_status) ? `<span class="activity-country">Associated facility: ${e(r.facility_status.toLowerCase())}</span>` : ""}</span>${icon("chevron-right")}</button></li>`;
    })
    .join("")}</ul>`;
}
function renderMap() {
  visible = filterRecords(records, state);
  main.innerHTML = `<section class="workspace-heading"><h1 class="sr-only">International partnerships map</h1>${workspaceFilters()}<div class="mobile-view-switch" role="group" aria-label="Explore view"><button data-view="list" aria-pressed="${state.view === "list"}">List</button><button data-view="map" aria-pressed="${state.view === "map"}">Map</button></div></section><div class="research-workspace" data-mobile-view="${e(state.view)}"><aside class="activity-pane" aria-label="Matching activities"><div class="activity-context"><h2>Activity</h2><span role="status">${visible.length} results</span></div>${visible.length ? activityRows([...visible].sort((a, b) => a.institution.localeCompare(b.institution) || a.partner.localeCompare(b.partner))) : empty()}</aside><section class="map-canvas" aria-label="Activity map"><p class="sr-only" id="map-help">Approximate locations. Arrow keys pan; plus and minus zoom. Enter reaches the first location; arrow keys move between locations. Enter opens an activity or a cluster list. The List view offers every activity.</p><svg id="world-map" class="world-map" role="group" tabindex="0" aria-label="International activity map" aria-describedby="map-help"></svg><div class="map-controls"><button data-zoom="in" aria-label="Zoom in">${icon("plus")}</button><button data-zoom="out" aria-label="Zoom out">${icon("minus")}</button><button data-zoom="reset">Reset view</button><button data-fullscreen aria-label="Expand map" aria-pressed="false">${icon("maximize")}</button></div><div class="map-legend">${legend()}</div><div id="map-cluster-panel"></div><div id="map-selection"></div><div class="map-attribution"><a href="${url("assets/MAP-SOURCES.md")}">Approximate locations · Natural Earth</a></div></section></div>`;
  drawMap();
  renderMapSelection();
}
function legend() {
  return '<span class="visible-legend"><span class="legend-sample" aria-hidden="true">3</span>Number = relationships at this location</span>';
}
function countryPanel() {}

function replaceRecordURL() {
  history.replaceState(
    null,
    "",
    location.pathname + (stateQuery(state) ? "?" + stateQuery(state) : ""),
  );
}
function selectMapRecord(id, { focus = false, market = "" } = {}) {
  const r = visible.find((r) => r.id === id);
  if (!r) return;
  selectedMarket = countriesOf(r).includes(market)
    ? market
    : state.country || r.country;
  state.record = id;
  replaceRecordURL();
  renderMapSelection();
  const loc =
    world && places
      ? locationOf(
          selectedMarket !== r.country
            ? { ...r, country: selectedMarket, city: "" }
            : r,
        )
      : null;
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
  main.querySelectorAll("[data-map-key]").forEach((n) => {
    const selected =
      mapGroups
        .find((g) => g.key === n.dataset.mapKey)
        ?.rows.some((x) => x.id === r?.id) || false;
    n.classList.toggle("selected", selected);
    n.setAttribute("aria-pressed", String(selected));
  });
  if (!r) {
    selectedMarket = "";
    host.innerHTML = "";
    return;
  }
  const market = state.country || selectedMarket || r.country;
  host.innerHTML = `<article class="selection-card" tabindex="-1" aria-label="Selected activity"><button class="close" data-dismiss-selection aria-label="Close selection">${icon("x")}</button><div class="eyebrow">${e(market)}</div><h2>${e(relationshipName(r))}</h2><p>${e(r.institution)}</p><p class="small">${e(market !== r.country ? market + " · documented market served" : r.city ? r.city + ", " + r.country : r.country + " · country-level location")} · Approximate location</p>${recordDetail(r, { fmt, compact: true })}<div class="selection-actions"><button data-selection-details>Full evidence</button><button data-copy>Copy link</button><a href="${url("markets/?country=" + encodeURIComponent(market))}">Country brief</a></div></article>`;
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
      (
        target ||
        main.querySelector(
          `[data-map-key="${mapGroups.find((g) => g.rows.some((x) => x.id === r.id))?.key}"]`,
        ) ||
        main.querySelector("[data-fullscreen]")
      )?.focus();
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

function mapEntries() {
  return visible.flatMap((r) =>
    (state.country ? [state.country] : countriesOf(r))
      .map((country) => {
        const loc = locationOf(
          country === r.country ? r : { ...r, country, city: "" },
        );
        return loc
          ? {
              r,
              country,
              xy: loc.xy,
              scope:
                country === r.country
                  ? loc.scope
                  : "Documented market served; not a staffed-office location",
            }
          : null;
      })
      .filter(Boolean),
  );
}
function updateMapView() {
  const svg = main.querySelector("#world-map");
  if (!svg) return;
  const width = 1000 / mapZoom,
    height = width / mapAspect();
  svg.setAttribute(
    "viewBox",
    `${mapCenter[0] - width / 2} ${mapCenter[1] - height / 2} ${width} ${height}`,
  );
  const layer = svg.querySelector("#map-pins");
  if (!layer || !world) return;
  const focused = mapGroups.find(
    (g) => g.key === document.activeElement?.dataset?.mapKey,
  )?.members[0];
  const unit = 1 / (svg.getScreenCTM()?.a || 1);
  mapGroups = clusterPoints(mapEntries(), unit).map((g, i) => ({
    ...g,
    key: String(i),
    rows: [...new Map(g.members.map((m) => [m.r.id, m.r])).values()],
  }));
  layer.innerHTML = mapGroups
    .map((g) => {
      const countries = [...new Set(g.members.map((m) => m.country))],
        one = g.rows.length === 1;
      const label = one
        ? `${g.rows[0].institution}; ${relationshipName(g.rows[0])}; ${countries.join(", ")}`
        : `${g.rows.length} activities in ${countries.join(", ")}`;
      return `<g class="pin ${g.rows.some((r) => r.id === state.record) ? "selected" : ""}" tabindex="-1" role="button" aria-pressed="${g.rows.some((r) => r.id === state.record)}" aria-label="${e(label)}" data-map-key="${g.key}" ${one ? `data-map-record="${e(g.rows[0].id)}"` : `data-map-cluster="${g.key}"`} data-x="${g.xy[0]}" data-y="${g.xy[1]}"><title>${e(label)} · Approximate location</title><g class="pin-marker" transform="translate(${g.xy[0]} ${g.xy[1]}) scale(${unit})"><circle class="pin-hit" r="22" fill="transparent"/><circle class="cluster-circle" r="${one ? 7 : 15}"/><circle class="pin-halo" r="${one ? 11 : 19}" fill="none"/>${one ? "" : `<text class="cluster-count" text-anchor="middle" y="5">${g.rows.length}</text>`}</g></g>`;
    })
    .join("");
  if (focused) {
    const next = mapGroups.find((g) =>
      g.members.some(
        (m) => m.r.id === focused.r.id && m.country === focused.country,
      ),
    );
    layer
      .querySelector(`[data-map-key="${next?.key}"]`)
      ?.focus({ preventScroll: true });
  }
}
function openCluster(key) {
  const g = mapGroups.find((g) => g.key === key);
  if (!g) return;
  const countries = [...new Set(g.members.map((m) => m.country))];
  if (countries.length > 1 && mapZoom < 5) {
    setCamera({
      ...fitPoints(
        g.members.map((m) => m.xy),
        mapAspect(),
      ),
      zoom: Math.min(
        12,
        Math.max(
          mapZoom * 1.8,
          fitPoints(
            g.members.map((m) => m.xy),
            mapAspect(),
          ).zoom,
        ),
      ),
    });
    return;
  }
  let panel = main.querySelector("#map-cluster-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "map-cluster-panel";
    main.querySelector(".map-canvas").append(panel);
  }
  panel.innerHTML = `<section class="cluster-panel" aria-label="Activities at this location"><button class="close" data-cluster-close aria-label="Close location activities">${icon("x")}</button><h2>${e(countries.join(" · "))}</h2><ul>${g.rows.map((r) => `<li><button data-cluster-record="${e(r.id)}"><strong>${e(r.institution)}</strong><span>${e(relationshipName(r))}</span></button></li>`).join("")}</ul></section>`;
  panel.querySelector("[data-cluster-close]").addEventListener("click", () => {
    panel.innerHTML = "";
    main.querySelector(`[data-map-key="${key}"]`)?.focus();
  });
  panel.querySelectorAll("[data-cluster-record]").forEach((n) =>
    n.addEventListener("click", () => {
      panel.innerHTML = "";
      if (isProfile()) showRecord(n.dataset.clusterRecord);
      else
        selectMapRecord(n.dataset.clusterRecord, {
          focus: true,
          market: g.members.find((m) => m.r.id === n.dataset.clusterRecord)
            ?.country,
        });
    }),
  );
  panel.querySelector("[data-cluster-record]")?.focus();
}
async function drawMap() {
  const svg = main.querySelector("#world-map");
  if (!svg) return;
  try {
    await geo();
    if (!svg.isConnected) return;
    const recorded = new Set(visible.flatMap(countriesOf));
    svg.innerHTML =
      "<title>International healthcare activity</title><desc>Clusters group nearby approximate locations. Select a location to inspect its activities.</desc>" +
      world.features
        .map((f) => {
          const name = aliases[f.properties.name] || f.properties.name;
          return `<path class="land ${recorded.has(name) ? "has-records" : ""} ${state.country === name ? "chosen" : ""}" d="${geoPath(f)}" data-country="${e(name)}"><title>${e(name)}</title></path>`;
        })
        .join("") +
      '<g id="map-pins"></g>';
    const points = mapEntries().map((l) => l.xy);
    if (
      (state.country || state.region || state.institution.length) &&
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
    const cluster = target.closest("[data-map-cluster]");
    if (cluster) {
      openCluster(cluster.dataset.mapCluster);
      return;
    }
    const pin = target.closest("[data-map-record]");
    if (pin) {
      if (isProfile()) showRecord(pin.dataset.mapRecord);
      else
        selectMapRecord(pin.dataset.mapRecord, {
          market: mapGroups.find((g) => g.key === pin.dataset.mapKey)
            ?.members[0]?.country,
        });
      return;
    }
    const country = target.closest("[data-country]")?.dataset.country;
    if (country && records.some((r) => countriesOf(r).includes(country))) {
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
    const pin = ev.target.closest("[data-map-key]");
    const pins = [...svg.querySelectorAll("[data-map-key]")];
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
    if (ev.key === "Escape" && main.querySelector(".cluster-panel")) {
      main.querySelector("[data-cluster-close]")?.click();
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
      if (pin.dataset.mapCluster) openCluster(pin.dataset.mapCluster);
      else if (isProfile()) showRecord(pin.dataset.mapRecord);
      else
        selectMapRecord(pin.dataset.mapRecord, {
          focus: true,
          market: mapGroups.find((g) => g.key === pin.dataset.mapKey)
            ?.members[0]?.country,
        });
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
    const dots = [...new Map(rows.map((r) => [r.country, r])).values()]
      .map((r) => {
        const l = locationOf(r);
        return l
          ? `<circle cx="${l.xy[0]}" cy="${l.xy[1]}" r="4" fill="#29676c"/>`
          : "";
      })
      .join("");
    const c = fitPoints(
        rows
          .map(locationOf)
          .filter(Boolean)
          .map((l) => l.xy),
        2.5,
      ),
      w = 1000 / c.zoom;
    node.innerHTML = `<svg viewBox="${c.x - w / 2} ${c.y - w / 5} ${w} ${w / 2.5}" role="img" aria-label="Approximate activity locations"><g>${world.features.map((f) => `<path class="land" d="${geoPath(f)}"/>`).join("")}${dots}</g></svg>`;
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
    compareSlots,
    compareChoices,
    marketSelected,
  };
}
function renderCoverage() {
  visible = [];
  main.innerHTML = coveragePage(pageContext());
}
function renderMarkets() {
  visible = state.country ? filterRecords(records, state) : [];
  const available = new Set(visible.flatMap(institutionsOf));
  marketSelected = marketSelected.filter((name) => available.has(name));
  main.innerHTML = marketsPage(pageContext());
  if (state.country && visible.length) drawMini("market-location", visible);
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
    const matches = names.filter((n) =>
      n.toLowerCase().includes(state.q.toLowerCase()),
    );
    main.innerHTML = `<div class="directory-heading"><h1 class="reader-title">Institutions</h1><a class="button" href="${url("compare/")}">Compare institutions</a></div><label class="directory-search">Search institutions<input id="record-search" type="search" placeholder="Find an institution" value="${e(state.q)}"></label><div class="institution-directory">${matches
      .map((n) => {
        const rows = records.filter((r) => institutionsOf(r).includes(n)),
          types = [...new Set(rows.map((r) => TACTICS[r.tactic_primary]))];
        return `<a class="institution-choice" href="${instLink(n)}"><h2>${e(n)}</h2><span>${e(types.slice(0, 2).join(" · ") || "No verified current records")}${types.length > 2 ? ` · +${types.length - 2}` : ""}</span>${icon("chevron-right")}</a>`;
      })
      .join("")}</div>`;
    return;
  }
  const rows = records.filter((r) => institutionsOf(r).includes(selected));
  document.body.classList.add("institution-profile");
  visible = filterRecords(rows, state);
  main.innerHTML =
    renderProfile({ selected, rows, visible, state, fmt, url, icon }) +
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
  const r = allRecords.find((x) => x.id === id);
  if (!r) return;
  if (
    isWorkspace() &&
    state.view === "list" &&
    window.matchMedia?.("(max-width: 760px)").matches
  )
    modal = true;
  if (isWorkspace() && !modal && visible.some((x) => x.id === id)) {
    selectMapRecord(id, { focus: true });
    return;
  }
  if (update) {
    state.record = id;
    replaceRecordURL();
  }
  dialog.innerHTML = `<div class="modal-head"><div><div class="eyebrow">${e(r.id)} · ${e(r.country)}</div><h2 id="dialog-title">${e(r.headline)}</h2></div><button class="close" aria-label="Close record" data-close>${icon("x")}</button></div><p>${e(r.institution)} · ${e(r.partner)}</p>${currentReader && !isCurrentRecord(r) ? '<p class="notice">This record is outside the verified current view. Its evidence is retained below.</p>' : ""}${recordDetail(r, { fmt })}<div class="selection-actions"><button data-copy>Copy record link</button><a href="${url("markets/?country=" + encodeURIComponent(state.country || r.country))}">Country brief</a></div>`;
  dialog
    .querySelector("[data-close]")
    .addEventListener("click", () => dialog.close());
  bindCopy(dialog);
  if (!dialog.open) dialog.showModal();
}
dialog.addEventListener("close", () => {
  if (
    state.record &&
    (!isWorkspace() ||
      !visible.some((r) => r.id === state.record) ||
      (state.view === "list" &&
        window.matchMedia?.("(max-width: 760px)").matches))
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
  main.querySelectorAll("[data-compare-slot]").forEach((n) =>
    n.addEventListener("change", () => {
      const slot = Number(n.dataset.compareSlot),
        value = n.value.trim();
      if (
        value &&
        (!names.includes(value) ||
          (compareChoices || state.institution).some(
            (x, i) => x === value && i !== slot,
          ))
      ) {
        toast("Choose a different listed institution");
        n.value = (compareChoices || state.institution)[slot] || "";
        return;
      }
      const selected = [...(compareChoices || state.institution)];
      selected[slot] = value;
      compareChoices = selected;
      change({ institution: selected.filter(Boolean).slice(0, 3), record: "" });
      main.querySelector(`[data-compare-slot="${slot}"]`)?.focus();
    }),
  );
  main.querySelector("[data-compare-add]")?.addEventListener("click", () => {
    compareSlots = 3;
    render();
    main.querySelector('[data-compare-slot="2"]')?.focus();
  });
  main.querySelectorAll("[data-compare-remove]").forEach((n) =>
    n.addEventListener("click", () => {
      const i = Number(n.dataset.compareRemove),
        selected = [...(compareChoices || state.institution)];
      if (i === 2) selected.splice(i, 1);
      else selected[i] = "";
      compareChoices = selected;
      if (i === 2) compareSlots = 2;
      change({ institution: selected.filter(Boolean), record: "" });
      main.querySelector('[data-compare-slot="0"]')?.focus();
    }),
  );
  main.querySelectorAll("[data-market-compare]").forEach((n) =>
    n.addEventListener("change", () => {
      marketSelected = [
        ...main.querySelectorAll("[data-market-compare]:checked"),
      ]
        .map((x) => x.dataset.marketCompare)
        .slice(0, 3);
      main
        .querySelectorAll("[data-market-compare]")
        .forEach(
          (x) => (x.disabled = marketSelected.length >= 3 && !x.checked),
        );
      const link = main.querySelector("[data-market-compare-run]");
      link.href = comparisonLink(marketSelected, state, url);
      link.setAttribute("aria-disabled", String(marketSelected.length < 2));
      main.querySelector("[data-market-compare-count]").textContent =
        marketSelected.length ? `(${marketSelected.length})` : "";
    }),
  );
  main
    .querySelector("[data-market-compare-run]")
    ?.addEventListener("click", (ev) => {
      if (marketSelected.length < 2) {
        ev.preventDefault();
        toast("Select two or three institutions");
      }
    });
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
      change({ ...readerState("", stateOptions), institution, view });
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
      change({
        ...readerState("", stateOptions),
        ...(page === "compare"
          ? { institution: state.institution }
          : page === "markets" && state.country
            ? { country: state.country }
            : {}),
      });
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
    (!isWorkspace() ||
      !visible.some((r) => r.id === state.record) ||
      (state.view === "list" &&
        window.matchMedia?.("(max-width: 760px)").matches))
  )
    showRecord(state.record, { update: false, modal: true });
}
window.addEventListener("keydown", (ev) => {
  if (dialog.open) return;
  if (ev.key === "Escape" && main.querySelector(".cluster-panel")) {
    ev.preventDefault();
    main.querySelector("[data-cluster-close]")?.click();
    return;
  }
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
    allRecords = data.records;
    records = currentReader ? allRecords.filter(isCurrentRecord) : allRecords;
    if (page === "compare") {
      state.institution = state.institution
        .filter((n) => names.includes(n))
        .slice(0, 3);
      compareSlots = Math.max(2, state.institution.length);
    }
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
    if (currentReader) replaceRecordURL();
    render();
  } catch (err) {
    main.innerHTML = `<div class="empty-state"><h1>The inventory could not load</h1><p>Refresh to try again, or use the source files below. A loading failure does not mean there are no records.</p><a class="button" href="${url("data/tracker.md")}">Read the complete tracker</a> <a class="button" href="${url("data/tracker.csv")}">Download canonical CSV</a> <a class="button" href="${url("methodology/")}">About &amp; sources</a></div>`;
    console.error(err);
  }
}
