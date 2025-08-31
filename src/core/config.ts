import { utils } from "./utils";

export const RENDERER_WIDTH = 1200;
export const RENDERER_HEIGHT = 720;
export const RENDERER_ASPECT = RENDERER_WIDTH / RENDERER_HEIGHT;
export const RENDERER_LARGEST = utils._max(RENDERER_WIDTH, RENDERER_HEIGHT);
export const RENDERER_SPRITE_RESOLUTION = 512;
export const MAX_SPRITE_COUNT = 10000;
export const FLOATS_PER_INSTANCE = 11; // mat3 (9) + layer (1) + opacity (1)
export const BYTES_PER_INSTANCE = FLOATS_PER_INSTANCE * 4;