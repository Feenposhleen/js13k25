import createGameWorker, { GameWorker } from './game_worker';
import createGameWindow, { GameWindow } from './game_window';
import { Scene } from './scene';
import MiniSequencer from './sound';

export class Game {
  _running: boolean = false;
  _initialScene: Scene | null = null;
  _game: GameWorker | GameWindow | null = null;
  _sound: MiniSequencer | null = null;

  constructor(scene: Scene) {
    this._initialScene = scene;
    if ((self as any).WorkerGlobalScope !== undefined) {
      this._game = createGameWorker();
      this._game._initialize(scene);
    } else {
      this._game = createGameWindow();
      this._sound = new MiniSequencer(new AudioContext());
      this._sound.playLoop({
        bpm: 96,
        octave: 2,
        bass: [1, 0, 0, 0, 1, 0, 1, 0],
        chords: [0, 0, 1, 0, 0, 0, 1, 1],
        snare: [0, 0, 1, 0, 0, 0, 1, 0],
        kick: [1, 0, 0, 0, 1, 0, 0, 0],
      });
      this._game._start();
    }
  }
}