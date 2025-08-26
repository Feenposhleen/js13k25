import { FullState } from "./game_worker";
import { Vec } from "./utils";

export type SpriteUpdater = (sprite: Sprite, state: FullState, delta: number) => void;

export type Sprite = {
  _texture: number[][] | null;
  _position: Vec;
  _scale: Vec;
  _angle: number;
  _opacity: number;
  _children: Sprite[];
  _updater: SpriteUpdater;
  _update: (state: FullState, dt: number) => void;
  _addChild: (sprite: Sprite) => void;
  _removeChild: (sprite: Sprite) => void;
  ___r?: Array<Float32Array>
};

const createSprite = (
  texture: number[][] | null,
  position: Vec,
  scale: Vec = [1, 1],
  opacity: number = 1,
  angle: number = 0,
): Sprite => {
  const _sprite: Sprite = {
    _texture: texture,
    _position: position,
    _scale: scale,
    _angle: angle,
    _opacity: opacity,
    _children: [] as Sprite[],
    _updater: () => { },

    _addChild: (sprite: Sprite): void => {
      _sprite._children.push(sprite);
    },

    _removeChild: (sprite: Sprite): void => {
      const index = _sprite._children.indexOf(sprite);
      if (index !== -1) {
        _sprite._children.splice(index, 1);
      }
    },

    _update: (state: FullState, delta: number): void => _sprite._updater(_sprite, state, delta),
  }

  return _sprite;
};

export default createSprite;
