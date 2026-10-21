import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterRecords,
  readState,
  stateQuery,
  csvExport,
  TACTICS,
  sortRecords,
} from "../assets/core.mjs";
import {
  secondaryMatch,
  filterChips,
  institutionSummary,
  statusText,
} from "../assets/research.mjs";
import { recordDetail } from "../assets/record-view.mjs";
const data = JSON.parse(
    readFileSync(new URL("../data/tracker.json", import.meta.url), "utf8"),
  ),
  rows = data.records;
const state = (patch) => ({ ...readState(), ...patch });

test("active filtering includes operating baseline facilities without promoting unknowns", () => {
  const active = filterRecords(rows, state({ status: "Operational" }));
  for (const id of ["IHB-0003", "IHB-0018", "IHB-0070"])
    assert.ok(active.some((r) => r.id === id));
  assert.equal(active.length, 21);
  assert.equal(filterRecords(rows, state({ status: "Unknown" })).length, 70);
  assert.ok(!active.some((r) => r.id === "IHB-0081"));
  assert.equal(rows.find((r) => r.id === "IHB-0003").seed_kind, "baseline");
  assert.ok(rows.every((r) => r.last_verified === "2026-10-20"));
});

test("legacy baseline and Other URLs remain useful after migration", () => {
  const old = readState("status=Baseline&institution=Mayo+Clinic");
  assert.equal(old.status, "");
  assert.equal(old.footprint, "baseline");
  assert.ok(filterRecords(rows, old).every((r) => r.seed_kind === "baseline"));
  assert.equal(filterRecords(rows, readState("region=Other")).length, 4);
  assert.ok(!stateQuery(old).includes("status=Baseline"));
});

test("secondary filters explain matches and research has an explicit empty inventory", () => {
  const s = state({ lens: "patient", tactic: "T9" }),
    result = filterRecords(rows, s);
  assert.equal(result.length, 42);
  assert.ok(secondaryMatch(result[0], s, TACTICS).includes("Inbound patient"));
  assert.equal(filterRecords(rows, state({ lens: "research" })).length, 0);
  assert.equal(
    filterRecords(rows, state({ lens: "does-not-exist" })).length,
    0,
  );
  const chips = filterChips(
    state({ status: "Unknown", lens: "research", footprint: "baseline" }),
    TACTICS,
  );
  assert.ok(chips.some((c) => c.label === "Status not established"));
  assert.ok(chips.some((c) => c.label === "Research partnerships"));
});

test("shared agreements remain one record across institution comparison membership", () => {
  const a = institutionSummary(rows, "Mass General Brigham"),
    b = institutionSummary(rows, "Dana-Farber Cancer Institute");
  assert.equal(a.rows.length, 2);
  assert.equal(b.rows.length, 5);
  assert.ok(a.rows.some((r) => r.id === "IHB-0081"));
  assert.ok(b.rows.some((r) => r.id === "IHB-0081"));
  assert.equal(rows.filter((r) => r.id === "IHB-0081").length, 1);
});

test("active advisory status preserves its associated planned facility caveat", () => {
  const r = rows.find((r) => r.id === "IHB-0072"),
    html = recordDetail(r);
  assert.equal(statusText(r), "Active / operational");
  assert.equal(r.facility_status, "Planned");
  assert.ok(html.includes("hospital remains planned"));
  assert.ok(html.includes("Associated facility"));
});

test("filtered export preserves month precision, caveats, evidence and view provenance", () => {
  const r = rows.find((r) => r.id === "IHB-0097"),
    s = state({ country: "Egypt", view: "map" });
  const csv = csvExport([r], {
    inventory_as_of: data.generated_as_of,
    reader_version: data.reader_version,
    source_sha256: data.source_sha256,
    filters: s,
  });
  for (const field of [
    "latest_event_month",
    "status_note",
    "scope_note",
    "source_urls",
    "events",
    "inventory_as_of",
    "reader_version",
    "source_sha256",
    "view_filters",
  ])
    assert.ok(csv.includes('"' + field + '"'));
  assert.ok(csv.includes("2026-01"));
  assert.ok(csv.includes(data.source_sha256));
  assert.ok(csv.includes("country=Egypt&view=map"));
  assert.ok(csv.includes(r.source_note.replaceAll('"', '""')));
  const sorted = sortRecords(
    [
      { id: "a", latest_event_month: "2026-01" },
      { id: "b", latest_event_date: "2025-12-31" },
    ],
    "latest_event_date",
    -1,
  );
  assert.equal(sorted[0].id, "a");
});
