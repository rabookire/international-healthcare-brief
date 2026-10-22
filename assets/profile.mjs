import { statusText, regionText } from "./research.mjs";
import {
  TACTICS,
  COLORS,
  REGIONS,
  escapeHTML as e,
  safeURL,
  stateQuery,
} from "./core.mjs";

// Profile labels share the canonical activity taxonomy.
export const PROFILE_LABELS = {
  ...TACTICS,
  T1: "Facilities",
  T5: "Partnerships",
  T6: "In-Country Representative",
};
export const PROFILE_COLORS = {
  ...COLORS,
  T1: "#087e82",
  T5: "#7c3b96",
  T6: "#2470d8",
  T11: "#b06a14",
};
export const profileEventDate = (r) =>
  r.latest_event_date || r.latest_event_month || r.announcement_date || "";
export function recentDevelopments(rows, limit = 3) {
  return rows
    .filter((r) => r.seed_kind !== "baseline" && profileEventDate(r))
    .sort(
      (a, b) =>
        profileEventDate(b).localeCompare(profileEventDate(a)) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}
export function profileTypes(rows, current = "", includeSecondary = false) {
  const present = new Set(
    rows.flatMap((r) =>
      includeSecondary
        ? [r.tactic_primary, ...(r.tactic_secondary || [])]
        : [r.tactic_primary],
    ),
  );
  if (current && TACTICS[current]) present.add(current);
  return Object.keys(TACTICS).filter((t) => present.has(t));
}
export function hasProfileFilters(s) {
  return Boolean(
    s.region ||
      s.tactic ||
      s.country ||
      s.status ||
      s.q ||
      s.year ||
      s.footprint !== "all" ||
      s.lens,
  );
}
export function profileSymbol(tactic, size = 6) {
  if (tactic === "T11")
    return `M0,${-size - 1}L${size + 1},0L0,${size + 1}L${-size - 1},0Z`;
  if (tactic === "T5") return `M0,${-size}L${size},${size}L${-size},${size}Z`;
  if (tactic === "T6")
    return `M${-size},${-size}h${2 * size}v${2 * size}h${-2 * size}Z`;
  return `M${-size},0a${size},${size} 0 1,0 ${size * 2},0a${size},${size} 0 1,0 ${-size * 2},0`;
}
const keySymbol = (t) =>
  `<svg viewBox="-9 -9 18 18" width="18" height="18" aria-hidden="true"><path d="${profileSymbol(t)}" fill="${PROFILE_COLORS[t]}"/></svg>`;
const conciseHeadlines = {
  "IHB-0017": "Allshores expands access to Cleveland Clinic",
  "IHB-0093": "Bupa cardiac-care pilot launches",
  "IHB-0008": "New in-country representative in El Salvador",
};

export function renderProfile({
  selected,
  rows,
  visible,
  state,
  note,
  fmt,
  url,
  icon,
}) {
  const types = profileTypes(rows, state.tactic, true),
    recent = recentDevelopments(visible);
  const regions = state.region === "Other" ? [...REGIONS, "Other"] : REGIONS;
  const select = (key, label, all, options) =>
    `<label class="profile-filter"><span>${label}</span><select data-filter="${key}" aria-label="${label}"><option value="">${all}</option>${options.map(([value, text]) => `<option value="${e(value)}" ${state[key] === value ? "selected" : ""}>${e(text)}</option>`).join("")}</select></label>`;
  const active = hasProfileFilters(state);
  const tracker = url(
    "data/?" + stateQuery({ ...state, record: "", view: "list" }),
  );
  const latestVerified = rows
    .map((r) => r.last_verified)
    .filter(Boolean)
    .sort()
    .at(-1);
  const listView = `<div class="profile-records"><p class="profile-result-count" role="status">${visible.length} sourced ${visible.length === 1 ? "record" : "records"}</p><ul>${visible.map((r) => `<li><div class="profile-record-meta">${e(r.country)} · ${e(PROFILE_LABELS[r.tactic_primary])}</div><h2><button class="record-title" data-record="${e(r.id)}">${e(r.headline)}</button></h2><div class="profile-record-footer"><span>${e(statusText(r))}</span><a href="${e(safeURL(r.source_url))}" target="_blank" rel="noopener noreferrer">Source ${icon("external-link")}</a></div></li>`).join("")}</ul></div>`;
  const empty = `<div class="profile-empty"><h2>${rows.length ? "No activity matches these filters" : "No verified footprint yet"}</h2><p>${rows.length ? "Try another region or activity type." : "Coverage is incomplete; this does not mean the institution has no international activity."}</p>${active ? "<button data-profile-reset>Clear filters</button>" : ""}</div>`;
  const map = `<section class="map-canvas profile-map" aria-label="Institution footprint"><svg id="world-map" class="world-map" role="group" tabindex="0" aria-label="${e(selected)} international footprint. Arrow keys pan; plus and minus zoom. Enter reaches the first marker; arrow keys move between markers. Enter opens source details. A list alternative is above the map."></svg><div class="profile-map-bottom"><div class="profile-legend" aria-label="Primary activity types">${profileTypes(
    visible,
  )
    .map((t) => `<span>${keySymbol(t)}${e(PROFILE_LABELS[t])}</span>`)
    .join(
      "",
    )}</div><div class="map-controls"><button data-zoom="out" aria-label="Zoom out">${icon("minus")}</button><button data-zoom="in" aria-label="Zoom in">${icon("plus")}</button><button data-zoom="reset">Reset map</button></div></div><div class="map-attribution"><a href="${url("assets/MAP-SOURCES.md")}">Natural Earth · Approximate locations</a><span class="sr-only" role="status">${visible.length} matching records</span></div></section>`;
  return `<section class="profile-heading"><a class="profile-back" href="${url("institutions/")}">← All institutions</a><div class="profile-title-line"><div><h1>${e(selected)}</h1><p>International footprint</p></div><span class="profile-verified">${latestVerified ? "Verified " + e(fmt(latestVerified)) : "Coverage in progress"}</span></div></section>
  <div class="profile-workspace"><section class="profile-primary" aria-label="Explore footprint"><div class="profile-toolbar">${select(
    "region",
    "Region",
    "All regions",
    regions.map((r) => [r, regionText(r)]),
  )}${select(
    "tactic",
    "Activity type",
    "All activity types",
    types.map((t) => [t, PROFILE_LABELS[t]]),
  )}<div class="profile-view" aria-label="Footprint view"><button data-profile-view="map" aria-pressed="${state.view !== "list"}">Map</button><button data-profile-view="list" aria-pressed="${state.view === "list"}">List</button></div></div>
  ${active ? `<div class="profile-active"><span>${state.country ? e(state.country) + " · " : ""}${visible.length} matching ${visible.length === 1 ? "record" : "records"}${state.tactic && visible.some((r) => r.tactic_primary !== state.tactic) ? " · Includes secondary activities" : ""}${state.status || state.q || state.year || state.footprint !== "all" ? " · Additional tracker filters applied" : ""}</span><button data-profile-reset>Clear filters</button></div>` : ""}
  ${!visible.length ? empty : state.view === "list" ? listView : map}</section>
  <aside class="profile-developments" aria-label="Recent developments"><h2>Recent developments</h2><p class="profile-recency">Latest sourced updates</p>${recent.length ? `<ol>${recent.map((r) => `<li><div class="development-meta"><span>${e(r.country)}</span><time datetime="${e(profileEventDate(r))}">${e(fmt(profileEventDate(r)))}</time></div><h3><button class="record-title" data-record="${e(r.id)}">${e(conciseHeadlines[r.id] || r.headline)}</button></h3><span class="development-status ${r.status === "Operational" ? "is-operational" : ""}">${e(statusText(r))}</span><a class="development-source" href="${e(safeURL(r.source_url))}" target="_blank" rel="noopener noreferrer">Source ${icon("external-link")}</a></li>`).join("")}</ol>` : `<div class="development-empty">${active ? "No dated developments match these filters." : "No dated developments in the sourced inventory."}</div>`}<a class="profile-all" href="${tracker}">View all activity ${icon("chevron-right")}</a></aside></div>
  <div class="profile-coverage"><span>${rows.length} sourced records · ${new Set(rows.map((r) => r.country)).size} countries · Partial inventory</span>${note ? `<details><summary>Coverage notes</summary><p>${e(typeof note.scope_checked === "string" ? note.scope_checked : JSON.stringify(note.scope_checked))}</p><p>${e(Array.isArray(note.unresolved) ? note.unresolved.join(" ") : note.unresolved || "")}</p><p>${e(note.backfill_status || "")}</p><p>In-Country Representative identifies a documented local representative or representative office helping patients access the hospital, including its US locations. An official hospital listing qualifies; insurer agreements have their own Insurer Partnership category.</p><a href="${url("methodology/")}">Methodology</a></details>` : ""}</div>`;
}
