// DOM integration tests execute the production reader against its real dataset.
// jsdom has no layout, browser accessibility tree, touch engine or visual output.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
const root = new URL("../", import.meta.url),
  origin = "https://example.test/international-healthcare-brief/";
const source = readFileSync(new URL("assets/app.mjs", root), "utf8");
const modules = {};
for (const match of source.matchAll(
  /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];/g,
)) {
  modules[match[2]] = await import(
    new URL("assets/" + match[2].replace("./", ""), root)
  );
}
const executable = source.replace(
  /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];/g,
  (_, bindings, path) =>
    `const {${bindings.replace(/\bas\b/g, ":")}}=modules[${JSON.stringify(path)}];`,
);
const settle = () => new Promise((resolve) => setImmediate(resolve));

async function reader(
  t,
  path = "",
  { fail = [], json = {}, mobile = false } = {},
) {
  const relative = path.split("?")[0],
    file = relative ? relative + "index.html" : "index.html";
  const dom = new JSDOM(readFileSync(new URL(file, root), "utf8"), {
    url: origin + path,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  t.after(() => dom.window.close());
  const w = dom.window,
    requests = [],
    blobs = [],
    copied = [],
    errors = [];
  Object.defineProperty(w, "matchMedia", {
    value: () => ({ matches: mobile }),
    configurable: true,
  });
  w.fetch = async (input) => {
    const p = new URL(input, origin).pathname.slice(
      new URL(origin).pathname.length,
    );
    requests.push(p);
    if (fail.includes(p)) return { ok: false, status: 503 };
    if (Object.hasOwn(json, p)) return { ok: true, json: async () => json[p] };
    try {
      const text = readFileSync(new URL(p, root), "utf8");
      return {
        ok: true,
        json: async () => JSON.parse(text),
        text: async () => text,
      };
    } catch {
      return { ok: false, status: 404 };
    }
  };
  w.console.error = (...args) => errors.push(args.map(String).join(" "));
  w.SVGElement.prototype.getScreenCTM = function () {
    return {
      a: 1000 / (Number(this.getAttribute("viewBox")?.split(" ")[2]) || 1000),
    };
  };
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new w.Event("close"));
  };
  w.URL.createObjectURL = (blob) => {
    blobs.push(blob);
    return "blob:reader-export";
  };
  w.URL.revokeObjectURL = () => {};
  w.Blob = Blob;
  w.HTMLAnchorElement.prototype.click = function () {};
  Object.defineProperty(w.navigator, "clipboard", {
    value: { writeText: async (value) => copied.push(value) },
  });
  let printed = 0;
  w.print = () => printed++;
  await w.Function("modules", `return (async()=>{${executable}\n})()`)(modules);
  await settle();
  const $ = (selector) => w.document.querySelector(selector),
    all = (selector) => [...w.document.querySelectorAll(selector)];
  const change = async (selector, value) => {
    const n = $(selector);
    assert.ok(n, selector);
    n.focus();
    n.value = value;
    n.dispatchEvent(new w.Event("change", { bubbles: true }));
    await settle();
  };
  const click = async (selector) => {
    const n = $(selector);
    assert.ok(n, selector);
    n.click();
    await settle();
  };
  return {
    w,
    $,
    all,
    change,
    click,
    requests,
    blobs,
    copied,
    errors,
    printed: () => printed,
  };
}

const dataset = JSON.parse(
  readFileSync(new URL("data/tracker.json", root), "utf8"),
);
const active = dataset.records.filter((r) => r.status === "Operational");
const activityIDs = (r) =>
  r
    .all(".activity-pane > .activity-list [data-record]")
    .map((n) => n.dataset.record);
test("current explorer ignores obsolete lifecycle URLs and keeps clusters readable", async (t) => {
  const r = await reader(t, "map/?status=Unknown&footprint=baseline");
  assert.equal(activityIDs(r).length, active.length);
  assert.equal(r.$('[data-filter="status"]'), null);
  assert.equal(r.$("[data-footprint]"), null);
  assert.ok(r.$(".visible-legend"));
  assert.ok(!r.$("main").textContent.includes("Global partnerships explorer"));
  assert.ok(!r.w.location.search.includes("status="));
  assert.ok(!activityIDs(r).includes("IHB-0081"));
  assert.ok(r.all("[data-map-key]").length < active.length);
  assert.equal(r.all(".pin-leader").length, 0);
  await r.change('[data-filter="country"]', "United Arab Emirates");
  assert.ok(activityIDs(r).includes("IHB-0003"));
  assert.ok(activityIDs(r).includes("IHB-0071"));
  assert.ok(!activityIDs(r).includes("IHB-0081"));
  await r.click('.activity-pane [data-record="IHB-0003"]');
  assert.match(r.$(".selection-card").textContent, /Abu Dhabi/);
  assert.ok(
    !r.$(".selection-card").textContent.includes("Active / operational"),
  );
  await r.click(".selection-card [data-copy]");
  assert.match(r.copied.at(-1), /record=IHB-0003/);
  await r.click("[data-dismiss-selection]");
  assert.equal(r.w.document.activeElement.dataset.record, "IHB-0003");
  assert.equal(r.errors.length, 0);
});
test("secondary matches and covered countries remain discoverable with view history", async (t) => {
  const r = await reader(t, "map/");
  await r.change('[data-filter="tactic"]', "T4");
  assert.ok(activityIDs(r).includes("IHB-0038"));
  assert.match(r.$('[data-record="IHB-0038"]').textContent, /Consulting/);
  await r.click("[data-reset]");
  await r.change('[data-filter="country"]', "Vietnam");
  assert.deepEqual(activityIDs(r), ["IHB-0042"]);
  assert.equal(r.all(".land.has-records").length, 1);
  await r.click('[data-view="map"]');
  assert.equal(r.$(".research-workspace").dataset.mobileView, "map");
  const previous = new Promise((resolve) =>
    r.w.addEventListener("popstate", resolve, { once: true }),
  );
  r.w.history.back();
  await previous;
  await settle();
  assert.equal(r.$(".research-workspace").dataset.mobileView, "list");
  await r.change('[data-filter="country"]', "Costa Rica");
  assert.ok(activityIDs(r).includes("IHB-0013"));
  await r.click('.activity-pane [data-record="IHB-0013"]');
  assert.match(r.$(".selection-card").textContent, /Costa Rica/);
  assert.equal(
    new URL(r.$('.selection-card a[href*="markets/"]').href).searchParams.get(
      "country",
    ),
    "Costa Rica",
  );
  assert.equal(r.errors.length, 0);
});
test("coincident locations offer reachable cluster activities and Escape restores map focus", async (t) => {
  const r = await reader(t, "map/?country=United+Kingdom&view=map");
  await r.click("[data-fullscreen]");
  assert.equal(r.$("#header").inert, true);
  r.$("#world-map").dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  assert.ok(r.w.document.activeElement.dataset.mapKey);
  r.$("[data-map-cluster]").dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  assert.ok(r.$(".cluster-panel"));
  r.w.document.activeElement.dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(r.$(".cluster-panel"), null);
  assert.equal(r.$("[data-fullscreen]").getAttribute("aria-pressed"), "true");
  r.$("[data-map-cluster]").dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  await r.click('[data-cluster-record="IHB-0001"]');
  await r.click("[data-dismiss-selection]");
  assert.ok(r.w.document.activeElement.dataset.mapKey);
  assert.equal(r.all('[data-map-key][aria-pressed="true"]').length, 0);
  r.w.dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(r.$("#header").inert, false);
  assert.equal(r.errors.length, 0);
});
test("mobile List opens visible evidence in the shared dialog", async (t) => {
  const r = await reader(t, "map/");
  Object.defineProperty(r.w, "matchMedia", {
    value: () => ({ matches: true }),
  });
  await r.click('.activity-pane [data-record="IHB-0001"]');
  assert.equal(r.$("#record-dialog").open, true);
  assert.match(r.$("#record-dialog").textContent, /Cleveland Clinic London/);
  assert.ok(r.$('#record-dialog a[href*="newsroom.clevelandclinic.org"]'));
  await r.click("#record-dialog [data-close]");
  assert.equal(r.w.location.search.includes("record="), false);
});
test("map regrouping keeps keyboard focus on the same record and market", async (t) => {
  const r = await reader(t, "map/?view=map");
  const target = r
    .all("[data-map-key]")
    .find((n) => n.getAttribute("aria-label").includes("Botswana"));
  assert.ok(target);
  target.focus();
  r.$("#world-map").dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "+", bubbles: true }),
  );
  assert.match(
    r.w.document.activeElement.getAttribute("aria-label"),
    /Botswana/,
  );
});
test("Markets clears comparison choices hidden by activity filters and history", async (t) => {
  const r = await reader(t, "markets/?country=United+Kingdom");
  await r.click('[data-market-compare="Cedars-Sinai"]');
  await r.change('[data-filter="tactic"]', "T11");
  assert.equal(r.$("[data-market-compare-count]").textContent, "");
  assert.equal(
    new URL(r.$("[data-market-compare-run]").href).searchParams.has(
      "institution",
    ),
    false,
  );
});
test("country-scoped comparison counts only the selected served market", async (t) => {
  const r = await reader(
    t,
    "compare/?institution=Cleveland+Clinic&institution=Mayo+Clinic&country=Cayman+Islands",
  );
  assert.deepEqual(
    r.all(".comparison-number").map((n) => n.textContent),
    ["1", "1"],
  );
  assert.deepEqual(
    r.all(".market-chips li").map((n) => n.textContent),
    ["Cayman Islands", "Cayman Islands"],
  );
});
test("compare selectors preserve an intentionally empty first slot", async (t) => {
  const r = await reader(t, "compare/");
  await r.change('[data-compare-slot="1"]', "Mayo Clinic");
  assert.equal(r.$('[data-compare-slot="0"]').value, "");
  assert.equal(r.$('[data-compare-slot="1"]').value, "Mayo Clinic");
  await r.change('[data-compare-slot="0"]', "Cleveland Clinic");
  assert.equal(r.all(".comparison-names h2").length, 2);
});
test("profile lists explain secondary activity matches", async (t) => {
  const r = await reader(
    t,
    "institutions/?institution=UPMC&tactic=T11&view=list",
  );
  assert.match(
    r.$(".profile-records").textContent,
    /Owned \/ operated facility/,
  );
  assert.match(
    r.$(".profile-records").textContent,
    /Also matches: Insurer Partnership/,
  );
});
test("Markets groups hospital activities and carries selected hospitals and market into Compare", async (t) => {
  const r = await reader(t, "markets/?country=United+Kingdom");
  assert.equal(r.$("h1").textContent, "United Kingdom");
  assert.equal(r.all(".hospital-brief").length, 3);
  assert.equal(r.all("table").length, 0);
  await r.click('[data-market-compare="Cleveland Clinic"]');
  await r.click('[data-market-compare="Mayo Clinic"]');
  const link = new URL(r.$("[data-market-compare-run]").href);
  assert.deepEqual(link.searchParams.getAll("institution"), [
    "Cleveland Clinic",
    "Mayo Clinic",
  ]);
  assert.equal(link.searchParams.get("country"), "United Kingdom");
  assert.equal(
    r.$("[data-market-compare-run]").getAttribute("aria-disabled"),
    "false",
  );
  await r.click('.hospital-brief [data-record="IHB-0001"]');
  assert.equal(r.$("dialog").open, true);
  assert.match(r.$("dialog").textContent, /Source checked/);
  assert.equal(r.errors.length, 0);
});
test("profiles retain map-first filtering, source evidence and honest empty-state recovery", async (t) => {
  const r = await reader(t, "institutions/?institution=Cleveland+Clinic");
  assert.ok(r.$(".profile-map"));
  assert.equal(r.all(".profile-developments li").length, 3);
  await r.change('[data-filter="region"]', "Americas");
  await r.change('[data-filter="tactic"]', "T11");
  r.$('[data-map-record="IHB-0017"]').dispatchEvent(
    new r.w.MouseEvent("click", { bubbles: true }),
  );
  assert.equal(r.$("dialog").open, true);
  await r.click("[data-close]");
  await r.click('[data-profile-view="list"]');
  assert.equal(r.$("#world-map"), null);
  assert.ok(r.$('.profile-records [data-record="IHB-0017"]'));
  await r.change('[data-filter="region"]', "Africa");
  assert.match(
    r.$(".profile-empty").textContent,
    /No verified current records/,
  );
  await r.click("[data-profile-reset]");
  assert.equal(r.$('[data-filter="tactic"]').value, "");
  assert.equal(r.w.document.activeElement.dataset.filter, "region");
  assert.ok(r.$(".profile-records"));
  assert.equal(r.errors.length, 0);
});
test("Compare exposes two searchable slots, optional third and duplicate prevention", async (t) => {
  const r = await reader(t, "compare/");
  assert.equal(r.all("[data-compare-slot]").length, 2);
  await r.change('[data-compare-slot="0"]', "Mayo Clinic");
  await r.change(
    '[data-compare-slot="1"]',
    "Johns Hopkins Medicine International",
  );
  assert.equal(r.all(".comparison-names > h2").length, 2);
  assert.equal(r.all("table").length, 0);
  await r.click("[data-compare-add]");
  await r.change('[data-compare-slot="2"]', "Cleveland Clinic");
  assert.equal(r.all(".comparison-names > h2").length, 3);
  await r.change('[data-compare-slot="2"]', "Mayo Clinic");
  assert.equal(r.$('[data-compare-slot="2"]').value, "Cleveland Clinic");
  assert.equal(r.$("[data-compare-add]"), null);
  for (const selector of ["[data-copy]", "[data-download]", "[data-print]"])
    assert.equal(r.$("main " + selector), null);
  await r.click('[data-compare-remove="2"]');
  assert.equal(r.all("[data-compare-slot]").length, 2);
  assert.equal(r.errors.length, 0);
});
test("shared agreements retain identity across comparison columns", async (t) => {
  const json = {
    "data/tracker.json": {
      ...dataset,
      records: dataset.records.map((r) =>
        r.id === "IHB-0081" ? { ...r, status: "Operational" } : r,
      ),
    },
  };
  const r = await reader(
    t,
    "compare/?institution=Mass+General+Brigham&institution=Dana-Farber+Cancer+Institute",
    { json },
  );
  const section = r
    .all(".comparison-dimension")
    .find((n) => n.querySelector("h2").textContent.includes("Consulting"));
  assert.equal(section.querySelectorAll('[data-record="IHB-0081"]').length, 2);
  assert.equal(
    json["data/tracker.json"].records.filter((r) => r.id === "IHB-0081").length,
    1,
  );
  assert.equal(r.errors.length, 0);
});
test("inactive deep links preserve evidence without entering current aggregates", async (t) => {
  const r = await reader(t, "map/?record=IHB-0081&status=Unknown");
  assert.ok(!activityIDs(r).includes("IHB-0081"));
  assert.equal(r.$("dialog").open, true);
  assert.match(r.$("dialog").textContent, /outside the verified current view/);
  assert.match(r.$("dialog").textContent, /Status not established/);
  assert.equal(r.errors.length, 0);
});
test("tracker search, sort and CSV retain the selected current source context", async (t) => {
  const r = await reader(t, "data/");
  const search = r.$("#record-search");
  search.value = "Nuria";
  search.dispatchEvent(new r.w.Event("input", { bubbles: true }));
  await settle();
  assert.equal(r.all("tbody tr").length, 1);
  assert.equal(r.w.document.activeElement.id, "record-search");
  await r.click('[data-sort="country"]');
  await r.click("[data-download]");
  const csv = await r.blobs[0].text();
  for (const field of [
    "scope_note",
    "source_urls",
    "covered_countries",
    "representative_location_note",
    "source_sha256",
  ])
    assert.ok(csv.includes('"' + field + '"'));
  assert.ok(csv.includes('"IHB-0008"'));
  await r.click("[data-reset]");
  assert.equal(r.all("tbody tr").length, active.length);
  assert.equal(r.errors.length, 0);
});
test("coverage and releases preserve research limitations outside primary surfaces", async (t) => {
  const r = await reader(t, "coverage/");
  assert.equal(r.all(".coverage-list details").length, 19);
  assert.ok(
    r.all(".coverage-stats strong").some((n) => n.textContent === "29"),
  );
  const update = await reader(t, "updates/");
  assert.match(update.$("main").textContent, /No edition has been published/);
  assert.ok(update.$("main").textContent.includes(dataset.reader_version));
  assert.equal(r.errors.length, 0);
  assert.equal(update.errors.length, 0);
});
test("archive country options include edition-only markets and combine with other filters", async (t) => {
  const json = {
    "data/briefs.json": {
      editions: [
        {
          date: "2026-10-22",
          title: "Belgium test fixture",
          countries: ["Belgium"],
          items: [
            {
              section: "market_signal",
              country: "Belgium",
              region: "Europe",
              tactic: "T5",
            },
          ],
        },
        {
          date: "2026-10-21",
          title: "Luxembourg test fixture",
          items: [
            {
              section: "market_signal",
              country: "Luxembourg",
              region: "Europe",
              tactic: "T5",
            },
          ],
        },
        {
          date: "2026-10-20",
          title: "UAE test fixture",
          countries: ["United Arab Emirates"],
          items: [{ record_id: "IHB-0003" }],
        },
      ],
    },
  };
  const r = await reader(t, "briefs/", { json });
  const countries = r.all('[data-filter="country"] option').map((n) => n.value);
  assert.equal(countries.filter((country) => country === "Belgium").length, 1);
  assert.ok(countries.includes("Luxembourg"));
  assert.deepEqual(countries.slice(1), [...countries.slice(1)].sort());
  await r.change('[data-filter="country"]', "Belgium");
  await r.change('[data-filter="region"]', "Europe");
  await r.change('[data-filter="tactic"]', "T5");
  assert.equal(r.all("#edition-list article").length, 1);
  assert.ok(r.$("#edition-list").textContent.includes("Belgium test fixture"));
  assert.equal(r.w.document.activeElement.dataset.filter, "tactic");
  assert.equal(
    new URLSearchParams(r.w.location.search).get("country"),
    "Belgium",
  );
  await r.change('[data-filter="from"]', "2026-10-23");
  assert.ok(r.$("#edition-list").textContent.includes("No editions match"));
  await r.click("[data-reset]");
  assert.equal(r.all("#edition-list article").length, 3);
  await r.change('[data-filter="country"]', "Luxembourg");
  assert.equal(r.all("#edition-list article").length, 1);
  assert.ok(
    r.$("#edition-list").textContent.includes("Luxembourg test fixture"),
  );
  const tracker = await reader(t, "data/", { json });
  assert.ok(
    !tracker
      .all('[data-filter="country"] option')
      .some((n) => n.value === "Belgium"),
  );
  assert.equal(r.errors.length, 0);
  assert.equal(tracker.errors.length, 0);
});

test("methodology loads independently and dataset failure has an explicit recovery path", async (t) => {
  const r = await reader(t, "methodology/", {
    fail: ["data/tracker.json", "data/evidence.json", "data/briefs.json"],
  });
  assert.equal(r.$("h1").textContent, "Methodology");
  assert.deepEqual(r.requests, ["METHODOLOGY.md"]);
  const failed = await reader(t, "map/", { fail: ["data/tracker.json"] });
  assert.ok(failed.$("main").textContent.includes("inventory could not load"));
  assert.ok(failed.$('main a[href$="methodology/"]'));
});

test("mobile shared links and switching to List keep evidence visible", async (t) => {
  const r = await reader(t, "map/?record=IHB-0001&view=list", { mobile: true });
  assert.equal(r.$("#record-dialog").open, true);
  await r.click("#record-dialog [data-close]");
  await r.click('[data-view="map"]');
  await r.click('.activity-pane [data-record="IHB-0001"]');
  await r.click('[data-view="list"]');
  assert.equal(r.$("#record-dialog").open, true);
});
test("unfiltered served-market cluster preserves its geography on selection", async (t) => {
  const r = await reader(t, "map/?view=map");
  for (let i = 0; i < 15; i++)
    r.$("#world-map").dispatchEvent(
      new r.w.KeyboardEvent("keydown", { key: "+", bubbles: true }),
    );
  const cayman = r
    .all("[data-map-cluster]")
    .find(
      (n) => n.getAttribute("aria-label") === "2 activities in Cayman Islands",
    );
  assert.ok(cayman);
  cayman.dispatchEvent(
    new r.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  await r.click('[data-cluster-record="IHB-0004"]');
  assert.match(r.$(".selection-card .eyebrow").textContent, /Cayman Islands/);
  assert.match(r.$(".selection-card").textContent, /documented market served/);
  assert.equal(
    new URL(r.$('.selection-card a[href*="markets/"]').href).searchParams.get(
      "country",
    ),
    "Cayman Islands",
  );
});
test("Compare uses dedicated selectors without redundant institution chips", async (t) => {
  const r = await reader(
    t,
    "compare/?institution=Mayo+Clinic&institution=Cleveland+Clinic",
  );
  assert.equal(r.all('[data-remove-key="institution"]').length, 0);
});
