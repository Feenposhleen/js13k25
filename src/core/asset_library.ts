import drawables, { RawDrawableData } from "./assets/drawables.gen";

const assetLibrary = {
  _textureCache: new Map<string, ImageData>(),
  _textureNameIndexCache: new Map<string, number>(),
  _textureIndexNameCache: new Map<number, string>(),

  async _preRenderTextures(): Promise<void> {
    let i = 0;

    // TODO: Handle names base on textureNameMap
    for (const textureData of drawables._textures) {
      this._textureCache.set(
        '',
        await this._preRenderTexture(
          (drawables as RawDrawableData)._palette,
          textureData,
        ),
      );

      this._textureNameIndexCache.set('', i);
      this._textureIndexNameCache.set(i, '');
      i++;
    }
  },

  async _preRenderTexture(
    palette: string[],
    textureData: number[][],
  ): Promise<ImageData> {
    // TODO: Replace with global sprite size
    const canvas = new OffscreenCanvas(100, 100);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < textureData.length; i++) {
      const poly = textureData[i];
      const color = palette[poly[0]];
      const style = textureData[1];

      const firstX = canvas.width * poly[2];
      const firstY = canvas.height * poly[3];

      ctx.beginPath();
      ctx.moveTo(firstX, firstY);

      for (let j = 4; j < poly.length; j += 2) {
        const x = canvas.width * poly[j];
        const y = canvas.height * poly[j + 1];
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  },

  _getTexture(name: string): ImageData | undefined {
    return this._textureCache.get(name);
  },

  _getTextureIndex(name: string): number {
    return this._textureNameIndexCache.get(name)!;
  },

  _getTextureName(index: number): string {
    return this._textureIndexNameCache.get(index)!;
  },

  _getTextureByIndex(index: number): ImageData {
    return this._textureCache.get(this._textureIndexNameCache.get(index)!)!;
  },
};

export default assetLibrary;

export type AssetLibrary = typeof assetLibrary;
