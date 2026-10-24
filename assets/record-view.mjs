import { TACTICS, escapeHTML as e, safeURL } from "./core.mjs";
import { statusText, historyText, eventDate } from "./research.mjs";

export function recordDetail(r, { fmt, compact = false } = {}) {
  const date = fmt || ((value) => value || "Not disclosed");
  if (compact)
    return `<div class="record-evidence"><p>${e(TACTICS[r.tactic_primary])}${["Planned", "Under construction"].includes(r.facility_status) ? " · Associated facility: " + e(r.facility_status.toLowerCase()) : ""}</p>${r.representative_location_note ? `<p>${e(r.representative_location_note)}</p>` : ""}<a class="source-link" href="${e(safeURL(r.source_url))}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a></div>`;
  const field = (name, value) =>
    `<div><dt>${e(name)}</dt><dd>${e(value || "Not disclosed")}</dd></div>`;
  const caveats = [
    ...new Set(
      [
        r.status_note,
        r.scope_note,
        r.facility_status === "Planned"
          ? "Associated facility: planned. An active advisory engagement does not establish that a facility is open."
          : "",
        r.status === "Unknown" && !r.status_note
          ? "Current status is not established; this does not mean inactive."
          : "",
      ].filter(Boolean),
    ),
  ];
  const dates =
    field("Latest recorded event", date(eventDate(r))) +
    field("Source checked", date(r.last_verified));
  const facts =
    field("Lifecycle", statusText(r)) +
    field("Activity", TACTICS[r.tactic_primary]) +
    (r.facility_status && r.facility_status !== "Not applicable"
      ? field("Associated facility", r.facility_status)
      : "");
  const source = `<a class="source-link" href="${e(safeURL(r.source_url))}" target="_blank" rel="noopener noreferrer">Read ${e((r.source_type || "public").toLowerCase())} source ↗</a>`;
  return `<div class="record-evidence">
    <dl class="detail-meta">${facts}${dates}${compact ? "" : field("Original announcement", date(r.announcement_date)) + field("Operational date", date(r.operational_date)) + field("Source published", date(r.source_date)) + field("Additional activities", (r.tactic_secondary || []).map((t) => TACTICS[t]).join("; ")) + field("Inventory history", historyText(r))}</dl>
    ${caveats.map((note) => `<p class="notice">${e(note)}</p>`).join("")}
    <p class="analysis"><strong>Analysis · Why it matters</strong><br>${e((r.analysis || "").replace(/^Analysis:\s*/, ""))}</p>
    <p>${source}</p>
    ${
      compact
        ? ""
        : `<p class="small muted">${e(r.source_note || "Facts trace to the linked public source. Dates that are not disclosed are not inferred.")}</p>
      ${(r.sources || [])
        .filter((s) => s.url !== r.source_url)
        .map(
          (s) =>
            `<p class="small"><a href="${e(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">Additional ${e(s.type || "public")} source ↗</a></p>`,
        )
        .join("")}
      ${(r.events || []).length ? `<section><h3>Sourced event history</h3><ol class="event-history">${r.events.map((ev) => `<li><strong>${e(date(ev.date))}</strong> · ${e(ev.summary)} <a href="${e(safeURL(ev.source_url))}" target="_blank" rel="noopener noreferrer">Source ↗</a></li>`).join("")}</ol></section>` : ""}
      <details class="changelog"><summary>Record change log</summary><p>${e(r.change_log || "No further changes recorded.")}</p></details>`
    }
  </div>`;
}
