export default {
  //##gen-begin
  _palette: [
    "#507180ff",
    "#3a4a55ff"
  ],
  _textures: [
    [
      [
        0,
        0,
        0, 1,
        0.5, 0,
        1, 1,
      ],
      [
        1,
        0,
        0.5, 0,
        1, 1,
        0.5, 1
      ],
    ],
  ],
  _textureNames: [
    "triangle",
  ],
  //##gen-end
} as RawDrawableData;

export type RawDrawableData = {
  _palette: string[];
  _textures: number[][][];
  _textureNames: string[];
};