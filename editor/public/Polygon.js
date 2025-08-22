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

  // Returns the index where to insert a new point
  // to be as close as possible to a line (approximately)
  closestIndex(coords) {
    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < this.points.length; i += 2) {
      const p = [this.points[i], this.points[i + 1]];
      const dist = this.distance(p, coords);

      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = i;
      }
    }

    return closestIndex;
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
