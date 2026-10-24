import {
  TACTICS,
  escapeHTML as e,
  institutionsOf,
  countriesOf,
  stateQuery,
} from "./core.mjs";
import { eventDate, secondaryMatch } from "./research.mjs";

export const TACTIC_ICONS = {
  T1: "home",
  T2: "link",
  T3: "briefcase",
  T4: "briefcase",
  T5: "link",
  T6: "users",
  T7: "globe",
  T8: "book-open",
  T9: "globe",
  T10: "book-open",
  T11: "shield",
};
export function activityIcon(tactic, url) {
  return `<img class="activity-icon" src="${url("assets/icons/" + (TACTIC_ICONS[tactic] || "link") + ".svg")}" width="24" height="24" alt="">`;
}
export const relationshipName = (r) => r.partner || r.headline;
export function activityItem(r, { url, country = true, state = {} } = {}) {
  const secondary = secondaryMatch(r, state, TACTICS);
  return `<li class="brief-activity">${activityIcon(r.tactic_primary, url)}<div><span class="activity-kind">${e(TACTICS[r.tactic_primary])}</span>${secondary ? `<span class="activity-location">Also matches: ${e(secondary)}</span>` : ""}<button class="record-title" data-record="${e(r.id)}">${e(relationshipName(r))}</button>${country ? `<span class="activity-location">${e(countriesOf(r).join(" · "))}</span>` : ""}${r.representative_location_note ? `<span class="activity-location">${e(r.representative_location_note)}</span>` : ""}${r.facility_status && ["Planned", "Under construction"].includes(r.facility_status) ? `<span class="activity-location">Associated facility: ${e(r.facility_status.toLowerCase())}</span>` : ""}</div></li>`;
}
export function activityCollection(rows, options) {
  const first = rows.slice(0, 4),
    rest = rows.slice(4);
  return `<ul class="brief-activities">${first.map((r) => activityItem(r, options)).join("")}</ul>${rest.length ? `<details class="more-activities"><summary>${rest.length} more ${rest.length === 1 ? "activity" : "activities"}</summary><ul class="brief-activities">${rest.map((r) => activityItem(r, options)).join("")}</ul></details>` : ""}`;
}
export function developmentList(rows, { fmt, limit = 3 } = {}) {
  const latest = [...rows]
    .filter((r) => eventDate(r))
    .sort(
      (a, b) =>
        eventDate(b).localeCompare(eventDate(a)) || a.id.localeCompare(b.id),
    )
    .slice(0, limit);
  return latest.length
    ? `<ol class="brief-developments">${latest.map((r) => `<li><time>${e(fmt(eventDate(r)))}</time><button class="record-title" data-record="${e(r.id)}">${e(r.headline)}</button><span>${e(r.institution)}</span></li>`).join("")}</ol>`
    : '<p class="muted">No dated developments in this view.</p>';
}
export function comparisonLink(names, state, url) {
  return url(
    "compare/?" +
      stateQuery({ ...state, institution: names, record: "", view: "list" }),
  );
}
export function hospitalBrief(
  name,
  rows,
  { url, market = false, chosen = [], state = {} } = {},
) {
  const matches = rows.filter((r) => institutionsOf(r).includes(name));
  return `<article class="hospital-brief"><header><h2><a href="${url("institutions/?institution=" + encodeURIComponent(name))}">${e(name)}</a></h2>${market ? `<label class="compare-check"><input type="checkbox" data-market-compare="${e(name)}" ${chosen.includes(name) ? "checked" : ""} ${chosen.length >= 3 && !chosen.includes(name) ? "disabled" : ""}>Compare</label>` : ""}</header>${matches.length ? activityCollection(matches, { url, country: !market, state }) : '<p class="muted">No verified current records for these filters.</p>'}</article>`;
}
