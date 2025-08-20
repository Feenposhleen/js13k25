import { TransferDataFromWindow } from "./game_window";
import { _buildRenderData, Renderer } from "./renderer";
import { Scene } from "./scene";

export type TransferDataFromWorker = {
  renderArray: Float32Array;
}

export type FullState = {
  game: GameWorker;
  state: GameState;
  input: TransferDataFromWindow;
}

const createGameWorker = () => {
  const _sceneRemoveList = new Set<Scene>();
  var _gameState: GameState | undefined;
  var _sceneTree: Scene[] = [];
  var _dataFromWindow: TransferDataFromWindow = { _keys: {}, _pointer: { _coord: [0, 0], _down: false } };
  var _lastTs: number = 0;
  var _state: FullState | undefined = undefined;

  self.onmessage = ({ data }: { data: TransferDataFromWindow }) => {
    _dataFromWindow = data;
    _updateGame();
  };

  const _updateWindow = (renderData: Float32Array) => {
    const data: TransferDataFromWorker = { renderArray: renderData };
    (self as any).postMessage(data, [renderData.buffer]);
  };

  const _updateGame = async () => {
    if (!_state) return;

    const now = performance.now();
    const delta = (now - _lastTs) / 1000;
    _lastTs = now;

    _state.input = _dataFromWindow;

    if (!_sceneTree.length) return;
    for (const scene of _sceneTree) {
      if (!scene._paused) {
        scene._update(_state, delta);
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

  const gameWorker = {
    _initialize(initialScene: Scene, initialState: GameState) {
      _state = {
        game: gameWorker,
        state: initialState,
        input: _dataFromWindow,
      };

      gameWorker._pushScene(initialScene);
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

  return gameWorker;
}

export default createGameWorker;

export type GameWorker = ReturnType<typeof createGameWorker>;