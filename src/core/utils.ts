import { Sprite, SpriteUpdater } from "./sprite";

export type Vec = [number, number];

export type Utils = typeof utils;

export const utils = {
  $: (selector: string): HTMLElement | null => {
    return document.querySelector(selector);
  },

  _rndFloat: (): number => {
    return Math.random();
  },

  _rndOne: (): number => {
    return (utils._rndFloat() - 0.5) * 2;
  },

  _rndRange: (point: number, spread = 10): number => {
    return point + (utils._rndOne() * spread);
  },

  _rndInt: (max: number, min = 0): number => {
    return Math.floor((utils._rndFloat() * (max - min)) + min);
  },

  _rndRadius: (pos: Vec, radius = 10): Vec => {
    return [utils._rndRange(pos[0], radius), utils._rndRange(pos[1], radius)];
  },

  _clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },

  // Distances

  _numberDistance: (num1: number, num2: number): number => {
    return Math.abs(num1 - num2);
  },

  _vectorDistance: (pos1: Vec, pos2: Vec): number => {
    return Math.max(
      utils._numberDistance(pos1[0], pos2[0]),
      utils._numberDistance(pos1[1], pos2[1]),
    );
  },

  // Vector operations

  _vectorIntersects: (subjectPos: Vec, boxPos: Vec, boxRadius: number): boolean => {
    const dist = utils._vectorDistance(subjectPos, boxPos);
    return (dist < boxRadius);
  },

  _vectorAdd: (pos1: Vec, pos2: Vec): Vec => {
    return [
      pos1[0] + pos2[0],
      pos1[1] + pos2[1],
    ];
  },

  _vectorAngle: (pos1: Vec, pos2: Vec): number => {
    return Math.atan2(pos1[0] - pos2[0], pos1[1] - pos2[1]);
  },

  _vectorLength: (vector: Vec): number => {
    return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
  },

  _vectorRotate: (vector: Vec, rotation: number): Vec => {
    return [
      (vector[0] * Math.cos(rotation)) - (vector[1] * Math.sin(rotation)),
      (vector[0] * Math.sin(rotation)) + (vector[1] * Math.cos(rotation)),
    ];
  },

  // mat3 helpers (column-major)

  _mat3Multiply: (out: Float32Array, a: Float32Array, b: Float32Array) => {
    const a00 = a[0], a10 = a[1], a20 = a[2], a01 = a[3], a11 = a[4], a21 = a[5], a02 = a[6], a12 = a[7], a22 = a[8];
    const b00 = b[0], b10 = b[1], b20 = b[2], b01 = b[3], b11 = b[4], b21 = b[5], b02 = b[6], b12 = b[7], b22 = b[8];
    out[0] = a00 * b00 + a01 * b10 + a02 * b20;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20;
    out[3] = a00 * b01 + a01 * b11 + a02 * b21;
    out[4] = a10 * b01 + a11 * b11 + a12 * b21;
    out[5] = a20 * b01 + a21 * b11 + a22 * b21;
    out[6] = a00 * b02 + a01 * b12 + a02 * b22;
    out[7] = a10 * b02 + a11 * b12 + a12 * b22;
    out[8] = a20 * b02 + a21 * b12 + a22 * b22;
    return out;
  },

  _mat3FromTRS: (tx: number, ty: number, angle: number, sx: number, sy: number, out: Float32Array) => {
    const c = Math.cos(angle || 0), s = Math.sin(angle || 0);
    const r00 = c * sx, r10 = s * sx;
    const r01 = -s * sy, r11 = c * sy;
    out[0] = r00; out[1] = r10; out[2] = 0;
    out[3] = r01; out[4] = r11; out[5] = 0;
    out[6] = tx; out[7] = ty; out[8] = 1;
    return out;
  },

  // Engine things

  _resolvePosition: (...nodes: Sprite[]): Vec => {
    const coord: Vec = [0, 0];
    const scale: Vec = [1, 1];
    let angle = 0;

    for (const node of nodes) {
      const lx = node._position[0] * scale[0];
      const ly = node._position[1] * scale[1];

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;

      coord[0] += rx;
      coord[1] += ry;

      scale[0] *= node._scale[0];
      scale[1] *= node._scale[1];
      angle += node._angle;
    }

    return coord;
  },

  _tweenUpdater: (
    sprite: Sprite,
    updaterTo: SpriteUpdater,
    duration: number,
  ): Promise<void> => {
    const updaterFrom = sprite._updater;
    let elapsed = 0;

    return new Promise((resolve) => {
      sprite._updater = (sprite, state, delta) => {
        elapsed = Math.min(duration, elapsed + delta);

        const fromSprite = sprite._copy();
        updaterFrom(fromSprite, state, delta);

        const toSprite = sprite._copy();
        updaterTo(toSprite, state, delta);

        const t = (elapsed / duration);
        sprite._position[0] = fromSprite._position[0] - ((toSprite._position[0] - fromSprite._position[0]) * t);
        sprite._position[1] = fromSprite._position[1] + ((toSprite._position[1] - fromSprite._position[1]) * t);
        sprite._scale[0] = fromSprite._scale[0] + ((toSprite._scale[0] - fromSprite._scale[0]) * t);
        sprite._scale[1] = fromSprite._scale[1] + ((toSprite._scale[1] - fromSprite._scale[1]) * t);
        sprite._angle = fromSprite._angle + ((toSprite._angle - fromSprite._angle) * t);
        sprite._opacity = fromSprite._opacity + ((toSprite._opacity - fromSprite._opacity) * t);

        if (elapsed >= duration) {
          sprite._updater = updaterTo;
          resolve();
        }
      };
    });
  },

  _wait: (duration: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration * 1000);
    });
  },
}
