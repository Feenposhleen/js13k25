import Sprite from "./sprite";

export abstract class GameScene {
  _paused: boolean = false;
  _done: boolean = false;
  _rootSprite: Sprite;

  constructor(rootSprite?: Sprite | null) {
    this._rootSprite = rootSprite || new Sprite(0, [0, 0]);
  }

  _update(gameState: Object, delta: number): void { };
}