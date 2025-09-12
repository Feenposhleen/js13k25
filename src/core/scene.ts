import { GameState } from "../game/state";
import { TransferDataFromWindow } from "./game_window";
import { FullState } from "./game_worker";
import createSprite, { Sprite } from "./sprite";

export type Scene = {
  _paused: boolean;
  _done: boolean;
  _rootSprite: Sprite;
  _updater: SceneUpdater;
  _update: (state: FullState, delta: number) => void;
};

export type SceneInitializer = (scene: Scene, game: FullState) => void;

export type SceneUpdater = (scene: Scene, state: FullState, delta: number) => void;

export default (initializer?: SceneInitializer) => {
  let initilai
  const _scene: Scene = {
    _paused: false,
    _done: false,
    _rootSprite: createSprite(null, [0, 0]),
    _updater: (scene: Scene, game: FullState, delta: number): void => { },
    _update: (state: FullState, delta: number): void => {
      if (initializer) {
        initializer(_scene, state);
        initializer = undefined;
      }

      if (!_scene._paused) {
        _scene._updater(_scene, state, delta);
        _scene._rootSprite._update(state, delta);
      }
    },
  }

  return _scene;
};