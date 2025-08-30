import createGameWorker, { GameWorker } from './game_worker';
import createGameWindow, { GameWindow } from './game_window';
import { Scene } from './scene';
import { GameState } from '../game/state';

export class Game {
  _running: boolean = false;
  _initialScene: Scene | null = null;
  _game: GameWorker | GameWindow | null = null;

  constructor(initialScene: Scene, initialState: GameState) {
    this._initialScene = initialScene;
    if ((self as any).WorkerGlobalScope !== undefined) {
      this._game = createGameWorker();
      this._game._initialize(initialScene, initialState);
    } else {
      this._game = createGameWindow();
      this._game._initialize();
    }
  }
}