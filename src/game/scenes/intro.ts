import { GameScene } from "../../core/scene";
import Sprite from "../../core/sprite";

export class IntroScene extends GameScene {
  _ticks: number = 0;

  constructor() {
    super(new Sprite(0, [300, 200], [2, 2]));
    this._rootSprite._addChild(
      new Sprite(0, [20, 20], [2, 2])
    );
  }

  override _update(gameState: Object, delta: number) {
    this._rootSprite._angle += delta * 0.1;
    this._ticks += delta;
  }
}