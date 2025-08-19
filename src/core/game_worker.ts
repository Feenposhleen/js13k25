import { TransferDataFromWindow } from "./game_window";
import { _buildRenderData, Renderer } from "./renderer";
import { Scene } from "./scene";

export type TransferDataFromWorker = {
  renderArray: Float32Array;
}

const createGameWorker = () => {
  const _sceneRemoveList = new Set<Scene>();
  var _sceneTree: Scene[] = [];
  var _dataFromWindow: TransferDataFromWindow = { keys: {}, pointer: null };
  var _lastTs: number = 0;

  self.onmessage = ({ data }: { data: TransferDataFromWindow }) => {
    _dataFromWindow = data;
    _updateGame();
  };

  const _updateWindow = (renderData: Float32Array) => {
    const data: TransferDataFromWorker = { renderArray: renderData };
    (self as any).postMessage(data, [renderData.buffer]);
  };

  const _updateGame = async () => {
    const now = performance.now();
    const delta = (now - _lastTs) / 1000;
    _lastTs = now;

    if (!_sceneTree.length) return;

    for (const scene of _sceneTree) {
      if (!scene._paused) {
        scene._update(_dataFromWindow, delta);
      }

      if (scene._done) { _sceneRemoveList.add(scene); }
    }

    const rootSprites = [];
    for (const scene of _sceneTree) {
      rootSprites.push(scene._rootSprite);
    }

    const renderData = _buildRenderData(rootSprites);
    _updateWindow(renderData);
  };

  const _ = {
    _initialize(initialScene: Scene) {
      _._pushScene(initialScene);
    },
    _pushScene(scene: Scene) {
      _sceneTree.push(scene);
    },
    _popScene() {
      if (_sceneTree.length > 1) _sceneTree.pop();
    },
    _removeScene(scene: Scene) {
      _sceneTree = _sceneTree.filter((existingScene) => existingScene !== scene);
    },
  };

  return _;
}

export default createGameWorker;

export type GameWorker = ReturnType<typeof createGameWorker>;