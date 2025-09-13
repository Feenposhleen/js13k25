import drawables, { RawDrawableData } from "./assets/drawables.gen";
import { RENDERER_SPRITE_RESOLUTION } from "./config";
import { PlayOptions } from "./sound";

const assetLibrary = {
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
    const canvas = new OffscreenCanvas(RENDERER_SPRITE_RESOLUTION, RENDERER_SPRITE_RESOLUTION);
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

  _getMusic(id: number): PlayOptions {
    switch (id) {
      case 1:
        return {
          _bpm: 120,
          _bass: [
            0, 1, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0,
          ],
          _snare: [
            0, 0, 1, 0,
            0, 0, 1, 0,
          ],
          _chords: [
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 1, 0,
          ],
          _kick: [
            1, 0, 0, 0,
            0, 1, 0, 0,
          ],
        };
      default:
        return {
          _bpm: 120,
        };
    }
  },

  _getSfx(id: number): PlayOptions {
    switch (id) {
      case 1:
        return {
          _bpm: 120,
          _bass: [1],
          _octave: 2,
        };
      default:
        return {
          _bpm: 120,
        };
    }
  },
};

export default assetLibrary;

export type AssetLibrary = typeof assetLibrary;
