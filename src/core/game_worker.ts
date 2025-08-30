import { GameState } from "../game/state";
import { InputState, TransferDataFromWindow } from "./game_window";
import { _buildRenderData, BYTES_PER_INSTANCE, FLOATS_PER_INSTANCE, MAX_SPRITE_COUNT, Renderer } from "./renderer";
import { Scene } from "./scene";
import { Vec } from "./utils";

export type TransferDataFromWorker = {
  _renderArray: Float32Array;
  _spriteCount: number;
}

export const defaultWorkerTransferData = (): TransferDataFromWorker => ({
  _renderArray: new Float32Array(MAX_SPRITE_COUNT * FLOATS_PER_INSTANCE),
  _spriteCount: 0,
});

export type FullState = {
  _game: GameWorker;
  _state: GameState;
  _input: InputState;
}

const createGameWorker = () => {
  const _sceneRemoveList = new Set<Scene>();
  var _sceneTree: Scene[] = [];
  var _keys: Record<string, boolean> = {};
  var _pointer = { _coord: <Vec>[0, 0], _down: false };
  var _lastTs: number = 0;
  var _state: FullState | undefined = undefined;
  var _input: InputState = { _keys: _keys, _pointer: _pointer };

  self.onmessage = ({ data }: { data: TransferDataFromWindow }) => {
    if (!_state) return;
    _state._input = data._input;
    _updateGame(data._freeRenderBuffer);
  };

  const _updateWindow = (renderBuffer: Float32Array, spriteCount: number) => {
    const data: TransferDataFromWorker = { _renderArray: renderBuffer, _spriteCount: spriteCount };
    (self as any).postMessage(data, [renderBuffer.buffer]);
  };

  const _updateGame = async (renderBuffer: Float32Array) => {
    if (!_state) return;

    const now = performance.now();
    const delta = (now - _lastTs) / 1000;
    _lastTs = now;

    if (!_sceneTree.length) return;
    for (const scene of _sceneTree) {
      if (!scene._paused) {
        scene._update(_state, delta);
      }

      if (scene._done) { _sceneRemoveList.add(scene); }
    }

    const spriteCount = _buildRenderData(_sceneTree.map((scene) => scene._rootSprite), renderBuffer);
    _updateWindow(renderBuffer, spriteCount);
  };

  const gameWorker = {
    _initialize(initialScene: Scene, initialState: GameState) {
      _state = {
        _game: gameWorker,
        _state: initialState,
        _input: _input,
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