import { TransferDataFromWindow } from "./game_window";
import { FullState } from "./game_worker";
import createSprite, { Sprite } from "./sprite";

export type Scene = {
  _paused: boolean;
  _done: boolean;
  _rootSprite: Sprite;
  _setUpdater: (updater: SceneUpdater) => void;
  _update: (state: FullState, delta: number) => void;
};

export type SceneUpdater = (scene: Scene, state: FullState, delta: number) => void;

export default (update?: SceneUpdater | undefined) => {
  var _updater: SceneUpdater = update || ((_, __, ___): void => { });

  const _scene = {
    _paused: false,
    _done: false,
    _rootSprite: createSprite(null, [0, 0]),
    _setUpdater: (updater: SceneUpdater) => _updater = updater,
    _update: (state: FullState, delta: number): void => {
      if (!_scene._paused) {
        _updater(_scene, state, delta);
        _scene._rootSprite._update(state, delta);
      }
    },
  }

  return _scene;
};