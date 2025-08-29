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
  _copy: () => Sprite;
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

    _update: (state: FullState, delta: number): void => {
      _sprite._updater(_sprite, state, delta);
      for (const child of _sprite._children) {
        child._update(state, delta);
      }
    },

    _copy: function (): Sprite {
      const newSprite = createSprite(
        this._texture,
        [this._position[0], this._position[1]],
        [this._scale[0], this._scale[1]],
        this._opacity,
        this._angle,
      );
      newSprite._updater = this._updater;
      return newSprite;
    },
  }

  return _sprite;
};

export default createSprite;
