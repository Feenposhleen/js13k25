import drawables from "./assets/drawables";

type RawDrawableData = {
  _palette: string[];
  _textures: {
    [key: string]: number[][];
  };
};

export class AssetLibrary {
  static _textureCache: Map<string, ImageData> = new Map();
  static _textureNameIndexCache: Map<string, number> = new Map();
  static _textureIndexNameCache: Map<number, string> = new Map();

  static async _preRenderTextures(): Promise<void> {
    var i = 0;
    for (const [name, textureData] of Object.entries((drawables as RawDrawableData)._textures)) {
      this._textureCache.set(
        name,
        await this._preRenderTexture(
          (drawables as RawDrawableData)._palette,
          textureData,
        ),
      );

      this._textureNameIndexCache.set(name, i);
      this._textureIndexNameCache.set(i, name);
      i++;
    }
  }

  static async _preRenderTexture(
    palette: string[],
    textureData: any[],
  ): Promise<ImageData> {
    //const canvas = new OffscreenCanvas(textureData[0][0], textureData[0][1]);

    // DEV
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = textureData[0][0];
    canvas.height = textureData[0][1];
    document.body.appendChild(canvas);
    // --

    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < textureData[1].length; i++) {
      const poly = textureData[1][i];
      const color = palette[poly[0]];
      const style = poly[1];

      const firstX = canvas.width * poly[2];
      const firstY = canvas.height * poly[3];

      ctx.beginPath();
      ctx.moveTo(firstX, firstY);
      console.log(`Line begins at(${firstX}, ${firstY})`);

      for (let j = 4; j < poly.length; j += 2) {
        const x = canvas.width * poly[j];
        const y = canvas.height * poly[j + 1];
        ctx.lineTo(x, y);
        console.log(`Drawing line to (${x}, ${y}) with color ${color}`);
      }

      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  static _getTexture(name: string): ImageData | undefined {
    return this._textureCache.get(name);
  }

  static _getTextureIndex(name: string): number {
    return this._textureNameIndexCache.get(name)!;
  }

  static _getTextureName(index: number): string {
    return this._textureIndexNameCache.get(index)!;
  }

  static _getTextureByIndex(index: number): ImageData {
    return this._textureCache.get(this._textureIndexNameCache.get(index)!)!;
  }
}

export default AssetLibrary;
