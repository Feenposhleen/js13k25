class EditorData {
  constructor(serializedData = null) {
    this.textures = {};
    this.palette = [];

    if (serializedData) {
      this.loadSerialized(serializedData);
    }
  }

  getColor(index) {
    return this.palette[index];
  }

  addColor(color) {
    this.palette.push(color);
  }

  changeColor(oldColor, newColor) {
    this.palette.splice(this.palette.indexOf(oldColor), 1, newColor);
    Object.values(textures).forEach(texture => {
      texture.polygons.forEach((polygon) => {
        if (polygon.color === oldColor) {
          polygon.color = newColor;
        }
      });
    });
  }

  removeColor(color) {
    this.palette.splice(this.palette.indexOf(color), 1);
    Object.values(textures).forEach(texture => {
      texture.polygons.forEach((polygon) => {
        if (polygon.color === color) {
          polygon.color = this.palette[0] || '#000';
        }
      });
    });
  }

  getTexture(name) {
    return this.textures[name];
  }

  addTexture(texture) {
    this.textures[texture.name] = texture
  }

  removeTexture(name) {
    delete this.textures[name];
  }

  renameTexture(oldName, newName) {
    const texture = this.getTexture(oldName);
    texture.setName(newName);
    delete this.textures[oldName];
    this.textures[newName] = texture;
    return texture;
  }

  clear() {
    this.textures = {};
    this.palette = [];
  }

  serialize() {
    const output = {
      _palette: this.palette,
      _textures: {},
    };

    Object.keys(this.textures).forEach((textureName) => {
      const texture = this.textures[textureName];
      output._textures[textureName] = texture.serialize(this.palette);
    });

    return output;
  }

  loadSerialized(serializedData) {
    this.palette = serializedData._palette;
    const serializedTextures = serializedData._textures;

    this.textures = {};
    Object.keys(serializedTextures).forEach((name) => {
      const polygons = serializedTextures[name].map((data) => Polygon.deserialize(data, this.palette));
      const texture = new Texture(name, polygons);
      this.addTexture(texture);
    });
  }
}
