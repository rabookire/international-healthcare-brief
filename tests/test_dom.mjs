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

async function reader(t, path = "", { fail = [], json = {} } = {}) {
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
  w.SVGElement.prototype.getScreenCTM = () => ({ a: 1 });
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

test("explorer filters active UAE facilities and keeps evidence, focus and export context", async (t) => {
  const r = await reader(t);
  assert.equal(r.all("[data-map-record]").length, 98);
  assert.equal(r.$(".research-workspace").dataset.mobileView, "list");
  await r.change('[data-filter="country"]', "United Arab Emirates");
  await r.change('[data-filter="status"]', "Operational");
  assert.equal(
    r.all(".activity-pane > .activity-list [data-record]").length,
    2,
  );
  assert.ok(r.$('[data-map-record="IHB-0003"]'));
  assert.equal(r.w.document.activeElement.dataset.filter, "status");
  await r.click('.activity-pane > .activity-list [data-record="IHB-0003"]');
  assert.ok(r.$(".selection-card h2").textContent.includes("Abu Dhabi"));
  assert.ok(
    r.$(".selection-card").textContent.includes("Active / operational"),
  );
  await r.click("[data-download]");
  const csv = await r.blobs[0].text();
  assert.ok(csv.includes('"scope_note"'));
  assert.ok(csv.includes("country=United+Arab+Emirates"));
  await r.click(".selection-card [data-copy]");
  assert.ok(r.copied.at(-1).includes("record=IHB-0003"));
  await r.click("[data-dismiss-selection]");
  assert.equal(r.w.document.activeElement.dataset.record, "IHB-0003");
  await r.click('[data-remove-key="status"]');
  assert.equal(r.all("[data-map-record]").length, 8);
  assert.equal(r.errors.length, 0);
});

test("map shading, secondary matches, search and view history track the filtered records", async (t) => {
  const r = await reader(t, "map/");
  await r.change('[data-filter="tactic"]', "T9");
  assert.equal(r.all("[data-map-record]").length, 42);
  assert.ok(r.$(".matched-tag").textContent.includes("Inbound patient"));
  await r.click("[data-reset]");
  await r.change('[data-filter="country"]', "Vietnam");
  assert.equal(r.all(".land.has-records").length, 1);
  assert.equal(r.all("[data-map-record]").length, 2);
  assert.ok(
    r
      .$(".country-overview summary")
      .textContent.includes("ignores other filters"),
  );
  await r.click('[data-view="map"]');
  assert.equal(r.$(".research-workspace").dataset.mobileView, "map");
  const previous = new Promise((resolve) =>
    r.w.addEventListener("popstate", resolve, { once: true }),
  );
  r.w.history.back();
  await previous;
  await settle();
  assert.equal(r.$(".research-workspace").dataset.mobileView, "list");
  await r.change('[data-filter="lens"]', "research");
  assert.equal(r.all("[data-map-record]").length, 0);
  assert.ok(
    r
      .$("main")
      .textContent.includes(
        "systematic research coverage has not been completed",
      ),
  );
  assert.equal(r.errors.length, 0);
});

test("closing mobile map details restores pin focus and keyboard navigation", async (t) => {
  const r = await reader(
    t,
    "map/?country=United+Arab+Emirates&status=Operational",
  );
  // jsdom has no responsive layout; model the mobile Map pane's CSS visibility.
  const style = r.w.document.createElement("style");
  style.textContent =
    '.research-workspace[data-mobile-view="map"] .activity-pane { display: none; }';
  r.w.document.head.append(style);
  await r.click('[data-view="map"]');
  for (const expanded of [false, true]) {
    if (expanded) await r.click("[data-fullscreen]");
    r.$('[data-map-record="IHB-0003"]').dispatchEvent(
      new r.w.MouseEvent("click", { bubbles: true }),
    );
    await r.click("[data-dismiss-selection]");
    assert.equal(r.w.document.activeElement.dataset.mapRecord, "IHB-0003");
    assert.equal(r.$(".selection-card"), null);
    assert.ok(!r.w.location.search.includes("record="));
    r.w.document.activeElement.dispatchEvent(
      new r.w.KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      }),
    );
    assert.equal(r.w.document.activeElement.dataset.mapRecord, "IHB-0071");
  }
  assert.equal(r.errors.length, 0);
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

test("country brief exports its selected records with cited print content", async (t) => {
  const r = await reader(t, "markets/?country=Vietnam");
  assert.equal(r.$("h1").textContent, "Vietnam");
  assert.equal(r.all("tbody [data-record]").length, 2);
  assert.equal(r.all(".print-sources li").length, 2);
  await r.click("[data-print]");
  assert.equal(r.printed(), 1);
  await r.click('tbody [data-record="IHB-0079"]');
  assert.equal(r.$("dialog").open, true);
  assert.ok(r.$("dialog").textContent.includes("Source checked"));
  assert.equal(r.errors.length, 0);
});

test("map-first profiles retain insurer filtering, evidence, exports and explicit List links", async (t) => {
  const r = await reader(t, "institutions/?institution=Cleveland+Clinic");
  assert.ok(r.w.document.body.classList.contains("institution-profile"));
  assert.equal(
    r.$('[data-profile-view="map"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(r.all(".profile-developments li").length, 3);
  assert.ok(r.$(".profile-map"));
  await r.change('[data-filter="region"]', "Americas");
  await r.change('[data-filter="tactic"]', "T11");
  assert.equal(r.all("[data-map-record]").length, 1);
  assert.ok(r.$('[data-map-record="IHB-0017"]'));
  assert.equal(r.all(".print-sources li").length, 1);
  await r.click("[data-download]");
  const csv = await r.blobs[0].text();
  assert.ok(csv.includes('"T11"'));
  assert.ok(csv.includes('"scope_note"'));
  await r.click("[data-print]");
  assert.equal(r.printed(), 1);
  r.$('[data-map-record="IHB-0017"]').dispatchEvent(
    new r.w.MouseEvent("click", { bubbles: true }),
  );
  assert.equal(r.$("dialog").open, true);
  assert.ok(r.$("dialog").textContent.includes("Source checked"));
  await r.click("[data-close]");
  await r.click('[data-profile-view="list"]');
  assert.equal(r.all('.profile-records [data-record="IHB-0017"]').length, 1);
  assert.equal(r.$("#world-map"), null);
  assert.equal(r.w.document.activeElement.dataset.profileView, "list");
  const linked = await reader(t, "institutions/" + r.w.location.search);
  assert.ok(linked.$(".profile-records"));
  await r.click("[data-profile-reset]");
  assert.equal(r.$('[data-filter="region"]').value, "");
  assert.equal(r.$('[data-filter="tactic"]').value, "");
  assert.equal(
    new URLSearchParams(r.w.location.search).get("institution"),
    "Cleveland Clinic",
  );
  assert.ok(r.$(".profile-records"));
  assert.equal(r.errors.length, 0);
  assert.equal(linked.errors.length, 0);
  const countryLinked = await reader(
    t,
    "institutions/?institution=Cleveland+Clinic&country=Bermuda&tactic=T11",
  );
  await countryLinked.change('[data-filter="region"]', "Europe");
  assert.ok(countryLinked.$('[data-map-record="IHB-0093"]'));
  assert.equal(
    new URLSearchParams(countryLinked.w.location.search).get("country"),
    null,
  );
  assert.equal(countryLinked.errors.length, 0);
});

test("profiles normalize legacy region links and preserve research empty-state recovery", async (t) => {
  const r = await reader(
    t,
    "institutions/?institution=UCLA+Health&region=Middle+East",
  );
  assert.equal(r.$('[data-filter="region"]').value, "Middle East (non-GCC)");
  assert.equal(r.all("[data-map-record]").length, 1);
  const research = await reader(
    t,
    "institutions/?institution=UCLA+Health&region=Middle+East&tactic=T10",
  );
  assert.ok(
    research.$(".profile-empty").textContent.includes("No activity matches"),
  );
  assert.equal(research.$('[data-filter="tactic"]').value, "T10");
  assert.ok(
    research.$("main").textContent.includes("systematic research coverage"),
  );
  await research.click("[data-profile-reset]");
  assert.ok(research.$(".profile-map"));
  assert.equal(research.$('[data-filter="tactic"]').value, "");
  assert.equal(research.w.document.activeElement.dataset.filter, "region");
  assert.equal(r.errors.length, 0);
  assert.equal(research.errors.length, 0);
});

test("comparison preserves a shared agreement in both columns and once in export", async (t) => {
  const r = await reader(
    t,
    "compare/?institution=Mass+General+Brigham&institution=Dana-Farber+Cancer+Institute",
  );
  assert.equal(r.all(".comparison-table").length, 2);
  assert.equal(r.all('.comparison-table [data-record="IHB-0081"]').length, 2);
  assert.equal(r.all(".print-sources li").length, 6);
  await r.click("[data-download]");
  const csv = await r.blobs[0].text();
  assert.equal((csv.match(/"IHB-0081"/g) || []).length, 1);
  assert.ok(r.$("main").textContent.includes("counts are not rankings"));
  assert.equal(r.errors.length, 0);
});

test("tracker search, sorting, dialog dismissal and clear filters retain usable state", async (t) => {
  const r = await reader(t, "data/");
  const search = r.$("#record-search");
  search.value = "non-binding";
  search.dispatchEvent(new r.w.Event("input", { bubbles: true }));
  await settle();
  assert.equal(r.all("tbody tr").length, 1);
  assert.equal(r.w.document.activeElement.id, "record-search");
  await r.click('[data-sort="country"]');
  assert.equal(r.w.document.activeElement.dataset.sort, "country");
  await r.click('[data-record="IHB-0050"]');
  assert.equal(r.$("dialog").open, true);
  await r.click("[data-close]");
  assert.ok(!r.w.location.search.includes("record="));
  await r.click("[data-reset]");
  assert.equal(r.all("tbody tr").length, 98);
  assert.equal(r.errors.length, 0);
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

test("coverage and update pages distinguish source review from reader changes", async (t) => {
  const coverage = await reader(t, "coverage/");
  assert.equal(coverage.all(".coverage-list details").length, 19);
  assert.ok(coverage.$("main").textContent.includes("70"));
  const updates = await reader(t, "updates/");
  assert.ok(
    updates.$("main").textContent.includes("No edition has been published"),
  );
  assert.ok(updates.$("main").textContent.includes("2026-10-21.1"));
  assert.equal(updates.errors.length, 0);
});
