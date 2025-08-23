class Polygon {
  constructor(points = [], color = "#000", style = 0) {
    this.points = points; // [x,y, x,y, x,y, ...]
    this.color = color; // e.g. "#ff00aa" or "rgba(...)"
    this.style = style; // e.g. 1=fill, 2=stroke, 3=both
  }

  insertPoint(index, coords) {
    this.points.splice(index, 0, coords[0], coords[1]);
  }

  setPoint(index, coords) {
    this.points[index] = coords[0];
    this.points[index + 1] = coords[1];
  }

  distance(p1, p2) {
    return Math.sqrt((Math.pow(p1[0] - p2[0], 2)) + (Math.pow(p1[1] - p2[1], 2)));
  }

  removePoint(index) {
    this.points.splice(index, 2);
  }

  pointIndex(coords) {
    for (let i = 0; i < this.points.length; i += 2) {
      const px = this.points[i];
      const py = this.points[i + 1];
      if (this.distance([px, py], coords) < 2) {
        return i;
      }
    }

    return -1;
  }

  // Returns the index where to insert a new point to be as close as possible to an edge
  closestIndex(coords) {
    if (this.points.length < 4) return 2;

    let best = { i: -1, j: -1, dist2: Infinity, point: null, t: 0 };
    const n = this.points.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = this.points[2 * i], ay = this.points[2 * i + 1];
      const j = (i + 1) % n;
      const bx = this.points[2 * j], by = this.points[2 * j + 1];

      const vx = bx - ax, vy = by - ay;
      const wx = coords[0] - ax, wy = coords[1] - ay;
      const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));

      const cx = ax + t * vx, cy = ay + t * vy;
      const dx = coords[0] - cx, dy = coords[1] - cy, d2 = dx * dx + dy * dy;

      if (d2 < best.dist2) {
        best = {
          i: 2 * i, j: 2 * j, dist2: d2,
          point: { x: cx, y: cy }, t
        };
      }
    }

    return best.j;
  }

  serialize(palette) {
    return [
      palette.indexOf(this.color),
      this.style,
      ...this.points.map(v => v / SvgPolygonView.resolution)
    ];
  }

  static deserialize(serializedData, palette) {
    return new Polygon(
      serializedData.slice(2).map(v => Math.round(v * SvgPolygonView.resolution)),
      palette[serializedData[0]],
      serializedData[1]
    );
  }
}
