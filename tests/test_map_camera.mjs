import test from "node:test";
import assert from "node:assert/strict";
import {
  HOME,
  constrain,
  zoomAt,
  panBy,
  fitPoints,
  spreadPoints,
  clusterPoints,
} from "../assets/map-camera.mjs";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("anchored clusters retain every member and separate as the screen scale grows", () => {
  const entries = [
    { id: "a", xy: [10, 10] },
    { id: "b", xy: [35, 10] },
    { id: "c", xy: [90, 10] },
  ];
  const grouped = clusterPoints(entries, 1),
    zoomed = clusterPoints(entries, 0.25);
  assert.equal(grouped.length, 2);
  assert.equal(zoomed.length, 3);
  assert.deepEqual(grouped.flatMap((g) => g.members.map((m) => m.id)).sort(), [
    "a",
    "b",
    "c",
  ]);
  assert.deepEqual(
    entries.map((m) => m.xy),
    [
      [10, 10],
      [35, 10],
      [90, 10],
    ],
  );
  assert.deepEqual(grouped[0].xy, [22.5, 10]);
});
test("anchored zoom keeps the same world point at the same viewport fraction", () => {
  const c = { x: 500, y: 220, zoom: 2 },
    point = { x: 600, y: 180 },
    z = zoomAt(c, 1.75, point);
  near((point.x - c.x) * c.zoom, (point.x - z.x) * z.zoom);
  near((point.y - c.y) * c.zoom, (point.y - z.y) * z.zoom);
  const back = zoomAt(z, 1 / 1.75, point);
  near(back.x, c.x);
  near(back.y, c.y);
  near(back.zoom, c.zoom);
});
test("extreme zoom and pan keep the camera inside supported bounds", () => {
  assert.equal(zoomAt(HOME, 100).zoom, 12);
  assert.equal(zoomAt(HOME, 0.001).zoom, 1);
  assert.deepEqual(panBy(HOME, -9999, 9999), { x: 0, y: 440, zoom: 1 });
  assert.deepEqual(constrain({ x: 1500, y: -40, zoom: 90 }), {
    x: 1000,
    y: 0,
    zoom: 12,
  });
});
test("fit keeps all filtered locations visible for desktop and portrait map shapes", () => {
  const points = [
    [270, 130],
    [515, 140],
    [690, 200],
  ];
  for (const aspect of [2, 0.65]) {
    const c = fitPoints(points, aspect),
      w = 1000 / c.zoom,
      h = w / aspect;
    for (const [x, y] of points) {
      assert.ok(x >= c.x - w / 2 && x <= c.x + w / 2);
      assert.ok(y >= c.y - h / 2 && y <= c.y + h / 2);
    }
  }
  assert.deepEqual(fitPoints([]), HOME);
  assert.ok(fitPoints([[500, 220]]).zoom <= 5);
});
test("coincident records are separate hit targets at different zoom scales", () => {
  for (const unit of [1, 0.2]) {
    const p = spreadPoints(
      Array.from({ length: 20 }, () => [500, 220]),
      unit,
    );
    for (let i = 0; i < p.length; i++)
      for (let j = 0; j < i; j++)
        assert.ok(
          Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]) >= 44 * unit - 1e-8,
        );
    assert.equal(new Set(p.map((x) => x.join(","))).size, 20);
  }
});

test("selecting an offscreen record reveals it without changing the reader zoom", async () => {
  const { revealPoint } = await import("../assets/map-camera.mjs");
  const c = { x: 100, y: 200, zoom: 8 },
    point = [850, 180],
    n = revealPoint(c, point, 2);
  assert.equal(n.zoom, c.zoom);
  assert.ok(Math.abs(n.x - point[0]) < 1000 / n.zoom / 2);
  assert.ok(Math.abs(n.y - point[1]) < 500 / n.zoom / 2);
  assert.equal(revealPoint(c, [100, 200], 2), c);
});
