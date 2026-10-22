// Shared reader vocabulary. Publication history is independent of lifecycle.
export const STATUS_LABELS = {
  Announced: "Announced",
  "In development": "In development",
  Operational: "Active / operational",
  "Suspended/restructured": "Suspended / restructured",
  "Closed/exited": "Ended / exited",
  Unknown: "Status not established",
};

export const LENSES = {
  patient: { label: "Patient access", tactics: ["T6", "T7", "T9", "T11"] },
  clinical: {
    label: "Care delivery & clinical collaboration",
    tactics: ["T1", "T5", "T7"],
  },
  advisory: { label: "Advisory & management", tactics: ["T3", "T4"] },
  investment: { label: "Ownership & joint ventures", tactics: ["T1", "T2"] },
  research: { label: "Research partnerships", tactics: ["T10"] },
  education: { label: "Education & workforce", tactics: ["T8"] },
};

export const statusText = (r) =>
  STATUS_LABELS[r.status] || "Status not established";
export const activityTags = (r) => [
  r.tactic_primary,
  ...(r.tactic_secondary || []),
];
export const eventDate = (r) =>
  r.latest_event_date || r.latest_event_month || r.announcement_date || "";
export const historyText = (r) =>
  ({
    baseline: "Initial inventory",
    backfill: "Historical activity",
    new: "New activity",
  })[r.seed_kind] || "Initial inventory";
const canonicalRegion = (region) =>
  region === "Middle East" ? "Middle East (non-GCC)" : region;
export const regionText = (region) =>
  region === "Other"
    ? "Africa & non-GCC Middle East (legacy view)"
    : canonicalRegion(region);
export const regionMatches = (record, region) => {
  const actual = canonicalRegion(
      typeof record === "string" ? record : record.region,
    ),
    selected = canonicalRegion(region);
  return (
    !selected ||
    actual === selected ||
    (selected === "Other" &&
      ["Africa", "Middle East (non-GCC)"].includes(actual))
  );
};

export function coverageSummary(rows, institutions = []) {
  const covered = new Set(
    rows.flatMap(
      (r) => r.institutions || r.institution.split(";").map((n) => n.trim()),
    ),
  );
  return {
    records: rows.length,
    countries: new Set(rows.map((r) => r.country)).size,
    institutions: covered.size,
    listed: institutions.length,
    unknown: rows.filter((r) => r.status === "Unknown").length,
  };
}

export function filterChips(state, tactics) {
  const chips = (state.institution || []).map((value) => ({
    key: "institution",
    value,
    label: value,
  }));
  for (const key of [
    "q",
    "lens",
    "country",
    "region",
    "tactic",
    "status",
    "year",
    "footprint",
    "from",
    "to",
  ]) {
    const value = state[key];
    if (!value || (key === "footprint" && value === "all")) continue;
    let label = value;
    if (key === "q") label = `Search: ${value}`;
    if (key === "lens") label = LENSES[value]?.label || value;
    if (key === "region") label = regionText(value);
    if (key === "tactic") label = tactics[value] || value;
    if (key === "status") label = STATUS_LABELS[value] || value;
    if (key === "year") label = `Opened in ${value}`;
    if (key === "footprint")
      label = value === "baseline" ? "Initial inventory" : "Dated activity";
    if (key === "from" || key === "to")
      label = `${key === "from" ? "From" : "To"}: ${value}`;
    chips.push({ key, value, label });
  }
  return chips;
}

export function secondaryMatch(r, state, tactics) {
  const matched = (r.tactic_secondary || []).filter(
    (t) => t === state.tactic || LENSES[state.lens]?.tactics.includes(t),
  );
  return matched.map((t) => tactics[t]).join(" · ");
}

// All memberships participate in a comparison; shared agreements keep one ID.
export function institutionSummary(rows, name) {
  const matches = rows.filter((r) =>
    (r.institutions || r.institution.split(";").map((x) => x.trim())).includes(
      name,
    ),
  );
  return {
    name,
    rows: matches,
    countries: [...new Set(matches.map((r) => r.country))].sort(),
    unknown: matches.filter((r) => r.status === "Unknown").length,
    latest: matches.map(eventDate).filter(Boolean).sort().at(-1) || "",
    byTactic: (tactic) =>
      matches.filter((r) => activityTags(r).includes(tactic)),
  };
}
