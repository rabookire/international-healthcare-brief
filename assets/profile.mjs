import { activityCollection, developmentList } from "./presentation.mjs";
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
    .filter((r) => profileEventDate(r))
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
  fmt,
  url,
  icon,
}) {
  const select = (key, label, all, options) =>
    `<label class="compact-select"><span>${label}</span><select data-filter="${key}" aria-label="${label}"><option value="">${all}</option>${options.map(([value, text]) => `<option value="${e(value)}" ${state[key] === value ? "selected" : ""}>${e(text)}</option>`).join("")}</select></label>`;
  const regions = state.region === "Other" ? [...REGIONS, "Other"] : REGIONS;
  const types = profileTypes(rows, state.tactic, true);
  const empty = `<div class="profile-empty"><h2>No verified current records for these filters</h2><button data-profile-reset>Clear filters</button></div>`;
  const map = `<section class="map-canvas profile-map" aria-label="Institution footprint"><svg id="world-map" class="world-map" role="group" tabindex="0" aria-label="${e(selected)} international footprint. Arrow keys pan; plus and minus zoom. Enter reaches locations and opens an activity or cluster list. The List view offers every activity."></svg><div class="map-controls"><button data-zoom="in" aria-label="Zoom in">${icon("plus")}</button><button data-zoom="out" aria-label="Zoom out">${icon("minus")}</button><button data-zoom="reset">Reset map</button></div><div class="map-legend"><span class="visible-legend"><span class="legend-sample" aria-hidden="true">3</span>Number = relationships at this location</span></div><div id="map-cluster-panel"></div><div class="map-attribution"><a href="${url("assets/MAP-SOURCES.md")}">Approximate locations · Natural Earth</a><span class="sr-only" role="status">${visible.length} matching activities</span></div></section>`;
  return `<div class="profile-heading"><a class="profile-back" href="${url("institutions/")}">All institutions</a><div class="profile-title-line"><h1>${e(selected)}</h1><a class="button" href="${url("compare/?" + stateQuery({ ...state, record: "", view: "list" }))}">Add to comparison</a></div></div><div class="profile-workspace"><section class="profile-primary" aria-label="Explore footprint"><div class="profile-toolbar reader-filters">${select(
    "region",
    "Region",
    "All regions",
    regions.map((r) => [r, regionText(r)]),
  )}${select(
    "tactic",
    "Activity type",
    "All activity types",
    types.map((t) => [t, TACTICS[t]]),
  )}<button class="clear-filters" data-profile-reset>Clear filters</button><div class="profile-view" aria-label="Footprint view"><button data-profile-view="map" aria-pressed="${state.view !== "list"}">Map</button><button data-profile-view="list" aria-pressed="${state.view === "list"}">List</button></div></div>${state.country || state.q || state.lens || state.year ? `<p class="profile-active">${e([state.country, state.q, state.lens, state.year].filter(Boolean).join(" · "))} <button data-profile-reset>Clear filters</button></p>` : ""}${visible.length ? (state.view === "list" ? `<div class="profile-records">${activityCollection(visible, { url, country: true, state })}</div>` : map) : empty}</section><aside class="profile-developments" aria-label="Recent developments"><h2>Recent developments</h2>${developmentList(visible, { fmt })}</aside></div>`;
}
