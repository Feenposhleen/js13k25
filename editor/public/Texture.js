class Texture {
  constructor(name, polygons = []) {
    this.name = name;
    this.polygons = polygons;
  }

  addPolygon(polygon) {
    this.polygons.push(polygon);
    return this;
  }

  removePolygon(polygon) {
    this.polygons.splice(indexOf(polygon), 1);
    return this;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  serialize() {
    return [...this.polygons.map(polygon => polygon.serialize())];
  }

  static deserialize(serializedData, palette) {
    this.polygons = serializedData.map(data => Polygon.deserialize(data, palette));
    return new Texture(serializedData.name, this.polygons);
  }
}
