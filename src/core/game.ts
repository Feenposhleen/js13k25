import createGameWorker, { GameWorker } from './game_worker';
import createGameWindow, { GameWindow } from './game_window';
import { Scene } from './scene';

export class Game {
  _running: boolean = false;
  _initialScene: Scene | null = null;
  _game: GameWorker | GameWindow | null = null;

  constructor(scene: Scene) {
    this._initialScene = scene;
    if ((self as any).WorkerGlobalScope !== undefined) {
      this._game = createGameWorker();
      this._game._initialize(scene);
    } else {
      this._game = createGameWindow();
      this._game._initialize();
    }
  }
}