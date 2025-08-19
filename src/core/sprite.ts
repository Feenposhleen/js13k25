import { Vec } from "./utils";

export type SpriteUpdater = (sprite: Sprite, gameState: Object, delta: number) => void;

export type Sprite = {
  _texture: number;
  _position: Vec;
  _scale: Vec;
  _angle: number;
  _opacity: number;
  _z: number;
  _children: Sprite[];
  _update: (gameState: Object, dt: number) => void;
  _setUpdater: (updater: SpriteUpdater) => void;
  _addChild: (sprite: Sprite) => void;
  _removeChild: (sprite: Sprite) => void;
};

const createSprite = (
  texture: number,
  position: Vec,
  scale: Vec = [1, 1],
  opacity: number = 1,
  angle: number = 0,
  z: number = 0,
): Sprite => {
  let _updater: SpriteUpdater = (sprite, gameState, delta) => { };

  const _sprite = {
    _texture: texture,
    _position: position,
    _scale: scale,
    _angle: angle,
    _opacity: opacity,
    _z: z,
    _children: [] as Sprite[],

    _addChild: (sprite: Sprite): void => {
      _sprite._children.push(sprite);
    },

    _removeChild: (sprite: Sprite): void => {
      const index = _sprite._children.indexOf(sprite);
      if (index !== -1) {
        _sprite._children.splice(index, 1);
      }
    },

    _setUpdater: (updater: SpriteUpdater) => _updater = updater,

    _update: (gameState: Object, dt: number): void => _updater(_sprite, gameState, dt),
  }

  return _sprite;
};

export default createSprite;
