import {
  LENSES,
  STATUS_LABELS,
  activityTags,
  regionMatches,
  regionText,
  statusText,
} from "./research.mjs";
export { regionMatches };
export const TACTICS = {
  T1: "Owned / operated facility",
  T2: "Joint venture",
  T3: "Management contract",
  T4: "Consulting / advisory",
  T5: "Strategic partnership",
  T6: "In-Country Representative",
  T7: "Remote care / second opinion",
  T8: "Education / training",
  T9: "Inbound patient channel",
  T10: "Research partnership",
  T11: "Insurer Partnership",
};
export const COLORS = {
  T1: "#0072B2",
  T2: "#D55E00",
  T3: "#009E73",
  T4: "#8C564B",
  T5: "#CC79A7",
  T6: "#7354B0",
  T7: "#007F86",
  T8: "#957000",
  T9: "#4C5969",
  T10: "#6D4596",
  T11: "#b06a14",
};
export const STATUSES = Object.keys(STATUS_LABELS);
export const REGIONS = [
  "GCC",
  "Americas",
  "Asia Pacific",
  "Europe",
  "Middle East (non-GCC)",
  "Africa",
];
export function institutionsOf(r) {
  return (
    r.institutions ||
    r.institution
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}
export function readState(search = "", { defaultView = "list" } = {}) {
  const p = new URLSearchParams(search),
    legacy = p.get("status") === "Baseline";
  return {
    institution: [...new Set(p.getAll("institution").filter(Boolean))],
    tactic: p.get("tactic") || "",
    region:
      p.get("region") === "Middle East"
        ? "Middle East (non-GCC)"
        : p.get("region") || "",
    country: p.get("country") || "",
    status: legacy ? "" : p.get("status") || "",
    footprint: legacy
      ? "baseline"
      : ["all", "baseline", "new"].includes(p.get("footprint"))
        ? p.get("footprint")
        : "all",
    q: p.get("q") || "",
    year: /^\d{4}$/.test(p.get("year") || "") ? p.get("year") : "",
    record: p.get("record") || "",
    from: p.get("from") || "",
    to: p.get("to") || "",
    lens: p.get("lens") || "",
    view: ["map", "list"].includes(p.get("view")) ? p.get("view") : defaultView,
  };
}
export function stateQuery(s) {
  const p = new URLSearchParams();
  for (const x of s.institution || []) p.append("institution", x);
  for (const k of [
    "tactic",
    "region",
    "country",
    "status",
    "q",
    "year",
    "record",
    "from",
    "to",
    "lens",
  ])
    if (s[k]) p.set(k, s[k]);
  if (s.footprint && s.footprint !== "all") p.set("footprint", s.footprint);
  if (["list", "map"].includes(s.view)) p.set("view", s.view);
  return p.toString();
}
export function filterRecords(rows, s) {
  const q = (s.q || "").trim().toLocaleLowerCase();
  return rows.filter(
    (r) =>
      (!s.institution?.length ||
        s.institution.some((x) => institutionsOf(r).includes(x))) &&
      (!s.tactic || activityTags(r).includes(s.tactic)) &&
      (!s.lens ||
        (LENSES[s.lens] &&
          activityTags(r).some((t) => LENSES[s.lens].tactics.includes(t)))) &&
      regionMatches(r, s.region) &&
      (!s.country || r.country === s.country) &&
      (!s.status || r.status === s.status) &&
      (s.footprint !== "baseline" || r.seed_kind === "baseline") &&
      (s.footprint !== "new" || r.seed_kind !== "baseline") &&
      (!s.year || (r.operational_date || "").startsWith(s.year)) &&
      (!q ||
        [
          r.id,
          r.institution,
          r.partner,
          r.country,
          regionText(r.region),
          r.city,
          r.headline,
          r.analysis,
          statusText(r),
          ...activityTags(r).map((t) => TACTICS[t]),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q)),
  );
}
export function sortRecords(rows, key = "last_verified", direction = -1) {
  const value = (r) =>
    key === "latest_event_date"
      ? r.latest_event_date || r.latest_event_month || r.announcement_date || ""
      : r[key] || "";
  return [...rows].sort(
    (a, b) =>
      direction * String(value(a)).localeCompare(String(value(b))) ||
      a.id.localeCompare(b.id),
  );
}
export function escapeHTML(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function safeURL(s = "") {
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : "#";
  } catch {
    return "#";
  }
}
export function csvCell(s = "") {
  s = String(s);
  if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function csvExport(rows, metadata = {}) {
  const keys = [
    "id",
    "institution",
    "partner",
    "country",
    "region",
    "city",
    "tactic_primary",
    "tactic_secondary",
    "status",
    "facility_status",
    "announcement_date",
    "operational_date",
    "latest_event_date",
    "latest_event_month",
    "headline",
    "analysis",
    "source_url",
    "source_type",
    "source_date",
    "last_verified",
    "seed_kind",
    "verified_status",
    "status_note",
    "scope_note",
    "source_note",
    "source_urls",
    "events",
    "change_log",
    "inventory_as_of",
    "reader_version",
    "source_sha256",
    "view_filters",
  ];
  return [
    keys,
    ...rows.map((r) =>
      keys.map((k) => {
        if (k === "source_urls")
          return [
            ...new Set([r.source_url, ...(r.sources || []).map((s) => s.url)]),
          ]
            .filter(Boolean)
            .join("; ");
        if (k === "events") return JSON.stringify(r.events || []);
        if (k === "view_filters")
          return stateQuery(metadata.filters || readState());
        if (k === "inventory_as_of") return metadata.inventory_as_of || "";
        if (k === "reader_version" || k === "source_sha256")
          return metadata[k] || "";
        return Array.isArray(r[k]) ? r[k].join("; ") : r[k] || "";
      }),
    ),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
export function project(lon, lat) {
  return [((lon + 180) * 1000) / 360, ((85 - lat) * 1000) / 360];
}
export function parseMarkdown(md, baseURL) {
  const inline = (t) =>
    escapeHTML(t)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
        const decoded = url.replaceAll("&amp;", "&");
        const ok =
          /^https:\/\//.test(decoded) ||
          (!/^[a-z][a-z0-9+.-]*:/i.test(decoded) &&
            !decoded.startsWith("//") &&
            !decoded.includes("\\"));
        let href = decoded;
        if (ok && baseURL) {
          try {
            href = new URL(decoded, baseURL).href;
          } catch {
            return label;
          }
        }
        return ok ? `<a href="${escapeHTML(href)}">${label}</a>` : label;
      })
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  const lines = md.replace(/^---\n[\s\S]*?\n---\n/, "").split("\n");
  let out = "",
    list = "",
    code = false,
    table = false;
  const close = () => {
    if (list) {
      out += `</${list}>`;
      list = "";
    }
    if (table) {
      out += "</tbody></table></div>";
      table = false;
    }
  };
  for (const line of lines) {
    if (line.startsWith("```")) {
      close();
      out += code ? "</code></pre>" : "<pre><code>";
      code = !code;
      continue;
    }
    if (code) {
      out += escapeHTML(line) + "\n";
      continue;
    }
    if (!line.trim()) {
      close();
      continue;
    }
    if (/^\|/.test(line)) {
      if (/^\|[\s:|-]+\|\s*$/.test(line)) continue;
      const cells = line.replace(/^\||\|$/g, "").split("|");
      if (!table) {
        close();
        out +=
          '<div class="table-wrap"><table><thead><tr>' +
          cells.map((c) => "<th>" + inline(c.trim()) + "</th>").join("") +
          "</tr></thead><tbody>";
        table = true;
      } else
        out +=
          "<tr>" +
          cells.map((c) => "<td>" + inline(c.trim()) + "</td>").join("") +
          "</tr>";
      continue;
    }
    if (table) close();
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      close();
      out += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
      continue;
    }
    const l = line.match(/^\s*(?:([-*])|\d+\.)\s+(.*)/);
    if (l) {
      const type = l[1] ? "ul" : "ol";
      if (list !== type) {
        close();
        list = type;
        out += `<${type}>`;
      }
      out += "<li>" + inline(l[2]) + "</li>";
      continue;
    }
    close();
    out += "<p>" + inline(line) + "</p>";
  }
  close();
  if (code) out += "</code></pre>";
  return out;
}

export function filterEditions(editions, records, s) {
  const selected = new Set(
    filterRecords(records, { ...s, q: "" }).map((r) => r.id),
  );
  const constrained = Boolean(
    s.institution?.length ||
      s.tactic ||
      s.region ||
      s.country ||
      s.status ||
      s.year ||
      s.lens ||
      s.footprint !== "all",
  );
  return editions.filter(
    (ed) =>
      (!s.from || ed.date >= s.from) &&
      (!s.to || ed.date <= s.to) &&
      (!s.q || JSON.stringify(ed).toLowerCase().includes(s.q.toLowerCase())) &&
      (!constrained ||
        (ed.items || []).some((item) => {
          if (item.record_id) return selected.has(item.record_id);
          if (
            item.section !== "market_signal" ||
            s.institution?.length ||
            s.status ||
            s.year ||
            s.footprint !== "all"
          )
            return false;
          return (
            regionMatches(item, s.region) &&
            (!s.country || item.country === s.country) &&
            (!s.tactic || item.tactic === s.tactic) &&
            (!s.lens || LENSES[s.lens]?.tactics.includes(item.tactic))
          );
        })),
  );
}

// Country summaries always identify the actual institutions, regardless of filters.
export function activityDisplay(r, s, { country = false } = {}) {
  const single = !country && s.institution?.length === 1;
  return {
    title: single ? r.partner : r.institution,
    partner: single ? "" : r.partner,
    shared: single
      ? institutionsOf(r).filter((n) => n !== s.institution[0])
      : [],
  };
}
