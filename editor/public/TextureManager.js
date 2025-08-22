class TextureManager {
  textures = new Map();

  addTexture(texture) {
    this.textures.set(texture.name, texture);
    return this;
  }

  createTexture(name) {
    const t = new Texture(name);
    this.addTexture(t);
    return t;
  }

  removeTexture(name) {
    this.textures.delete(name);
    return this;
  }

  getTexture(name) {
    return this.textures.get(name);
  }

  renameTexture(oldName, newName) {
    const t = this.getTexture(oldName);
    t.setName(newName);
    this.textures.delete(oldName);
    this.textures.set(newName, t);
    return t;
  }

  serialize(palette) {
    const output = {
      _palette: palette,
      _textures: {},
    };

    this.textures.forEach((texture, idx) => {
      output._textureNameMap[texture.name] = idx;

      const polygons = [];
      texture.polygons.forEach((polygon) => {
        polygons.push([
          palette.indexOf(polygon.color),
          polygon.style,
          ...polygon.points
        ]);
      });

      output._textures.push(texture.serialize());
      output._textureNameMap[texture.name] = idx;
    });

    return output;
  }

  loadSerialized(serializedData) {
    this.textures.clear();
    const palette = serializedData._palette;
    const serializedTextures = serializedData._textures;

    this.textures.clear();
    Object.keys(serializedTextures).forEach((name, idx) => {
      const polygons = serializedTextures[name].map((data) => Polygon.deserialize(data, palette));
      const texture = new Texture(name, polygons);
      this.addTexture(texture);
    });
  }
}
