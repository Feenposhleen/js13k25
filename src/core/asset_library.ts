import drawables, { RawDrawableData } from "./assets/drawables.gen";

const assetLibrary = {
  _dimensions: 256,
  _textures: drawables._textures,
  _textureCache: new Map<string, ImageData>(),
  _textureDataMap: new Map<number[][], number>(),

  async _preRenderTextures(): Promise<void> {
    let i = 0;


    for (const textureKey of Object.keys(assetLibrary._textures)) {
      this._textureCache.set(
        textureKey,
        await this._preRenderTexture(
          (drawables as RawDrawableData)._palette,
          (drawables._textures as any)[textureKey],
        ),
      );

      i++;
    }
  },

  async _preRenderTexture(
    palette: string[],
    textureData: number[][],
  ): Promise<ImageData> {
    // TODO: Replace with global sprite size
    const canvas = new OffscreenCanvas(this._dimensions, this._dimensions);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  _textureIndex(data: number[][]): number {
    if (this._textureDataMap.size === 0) {
      Object.keys(this._textures).forEach((key, i) => {
        this._textureDataMap.set((drawables._textures as any)[key], i);
      });
    }

    return this._textureDataMap.get(data)!;
  },
};

export default assetLibrary;

export type AssetLibrary = typeof assetLibrary;
