import GameWorker from './game_worker';
import GameWindow from './game_window';
import { GameScene } from './scene';

export class Game {
  _running: boolean = false;
  _initialScene: GameScene | null = null;
  _game: GameWorker | GameWindow | null = null;

  constructor(scene: GameScene) {
    this._initialScene = scene;
    if ((self as any).WorkerGlobalScope !== undefined) {
      this._game = new GameWorker();
      this._game._initialize(scene);
    } else {
      this._game = new GameWindow();
      this._game._start();
    }
  }
}