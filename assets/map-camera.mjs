// Camera math is independent of the DOM so mouse, touch and keyboard agree.
export const HOME = { x: 500, y: 220, zoom: 1 };
export function constrain(c) {
  return {
    x: Math.max(0, Math.min(1000, c.x)),
    y: Math.max(0, Math.min(440, c.y)),
    zoom: Math.max(1, Math.min(12, c.zoom)),
  };
}
export function zoomAt(c, factor, point = { x: c.x, y: c.y }) {
  const zoom = constrain({ ...c, zoom: c.zoom * factor }).zoom,
    ratio = c.zoom / zoom;
  return constrain({
    x: point.x + (c.x - point.x) * ratio,
    y: point.y + (c.y - point.y) * ratio,
    zoom,
  });
}
export function panBy(c, dx, dy) {
  return constrain({ ...c, x: c.x + dx, y: c.y + dy });
}
export function fitPoints(points, aspect = 2) {
  if (!points.length) return { ...HOME };
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]),
    xmin = Math.min(...xs),
    xmax = Math.max(...xs),
    ymin = Math.min(...ys),
    ymax = Math.max(...ys);
  const width = Math.max(
    140,
    (xmax - xmin) * 1.45,
    (ymax - ymin) * Math.max(0.5, aspect) * 1.45,
  );
  return constrain({
    x: (xmin + xmax) / 2,
    y: (ymin + ymax) / 2,
    zoom: Math.min(5, 1000 / width),
  });
}
export function spreadPoints(points, unit = 1) {
  const placed = [];
  return points.map((p) => {
    let x = p[0],
      y = p[1],
      i = 0;
    while (
      placed.some((q) => Math.hypot(x - q[0], y - q[1]) < 44 * unit) &&
      i < 2000
    ) {
      i++;
      const a = i * 2.4,
        r = (10 + Math.sqrt(i) * 8) * unit;
      x = p[0] + Math.cos(a) * r;
      y = p[1] + Math.sin(a) * r;
    }
    placed.push([x, y]);
    return [x, y];
  });
}
// Keep the current zoom when a newly selected activity is outside the viewport.
export function revealPoint(c, point, aspect = 2) {
  const w = 1000 / c.zoom,
    h = w / Math.max(0.5, aspect);
  if (
    point[0] >= c.x - w * 0.42 &&
    point[0] <= c.x + w * 0.32 &&
    point[1] >= c.y - h * 0.4 &&
    point[1] <= c.y + h * 0.35
  )
    return c;
  return constrain({ ...c, x: point[0] + w * 0.1, y: point[1] + h * 0.08 });
}
