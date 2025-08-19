export default {
  //##gen-begin
  _palette: [
    "#AA7939",
    "#EAD0AE",
    "#CAA26D"
  ],
  _textures: [
    [
      0,
      0,
      0.2, 0.5,
      0.8, 0.7,
      0.3, 1.0
    ],
  ],
  _textureNameMap: {
    "triangle": 0,
  },
  //##gen-end
} as RawDrawableData;

export type RawDrawableData = {
  _palette: string[];
  _textures: number[][];
  _textureNameMap: Record<string, number>;
};