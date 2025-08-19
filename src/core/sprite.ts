import { Vec } from "./utils";

export class Sprite {
  _texture: number;
  _position: Vec;
  _scale: Vec;
  _angle: number;
  _opacity: number = 1;
  _z: number;
  _children: Sprite[];

  constructor(
    _texture: number,
    _position: Vec,
    _scale: Vec = [1, 1],
    _opacity: number = 1,
    _angle: number = 0,
    _z: number = 0,
  ) {
    this._texture = _texture;
    this._position = _position;
    this._scale = _scale;
    this._angle = _angle;
    this._opacity = _opacity;
    this._z = _z;
    this._children = [];
  }

  _addChild(sprite: Sprite): void {
    this._children.push(sprite);
  }

  _removeChild(sprite: Sprite): void {
    const index = this._children.indexOf(sprite);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  // override me
  _update(dt: number): void { }
}

export default Sprite;
