import createSprite, { Sprite } from "./sprite";

export type Scene = {
  _paused: boolean;
  _done: boolean;
  _rootSprite: Sprite;
  _setUpdater: (updater: SceneUpdater) => void;
  _update: (gameState: Object, delta: number) => void;
};

export type SceneUpdater = (scene: Scene, gameState: Object, delta: number) => void;

const updateSpriteTree = (scene: Scene, gameState: Object, dt: number): void => {
  for (const child of scene._rootSprite._children) {
    child._update(gameState, dt);
    updateSpriteTree({ ...scene, _rootSprite: child }, gameState, dt);
  }
};

export default (update?: SceneUpdater | undefined) => {
  var _updater: SceneUpdater = update || ((scene, gameState, delta): void => { });


  const _scene = {
    _paused: false,
    _done: false,
    _rootSprite: createSprite(0, [0, 0]),
    _setUpdater: (updater: SceneUpdater) => _updater = updater,
    _update: (gameState: Object, delta: number): void => {
      if (!_scene._paused) {
        _updater(_scene, gameState, delta);
        updateSpriteTree(_scene, gameState, delta);
      }
    },
  }

  return _scene;
};