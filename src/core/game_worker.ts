import { TransferDataFromWindow } from "./game_window";
import { Renderer } from "./renderer";
import { GameScene } from "./scene";

export type TransferDataFromWorker = {
  renderArray: Float32Array;
}

class GameWorker {
  private _sceneTree: GameScene[] = [];
  private _sceneRemoveList = new Set<GameScene>();
  private _dataFromWindow: TransferDataFromWindow = { keys: {}, pointer: null };
  private _lastTs: number = 0;

  constructor() {
    self.onmessage = this._handleMessage.bind(this);
  }

  private _handleMessage({ data }: { data: TransferDataFromWindow }) {
    this._dataFromWindow = data;
    this._updateGame();
  }

  private _updateWindow(renderData: Float32Array) {
    const data: TransferDataFromWorker = { renderArray: renderData };
    (self as any).postMessage(data, [renderData.buffer]);
  }

  public async _initialize(initialScene: GameScene) {
    this._pushScene(initialScene);
  }

  public async _pushScene(scene: GameScene) {
    this._sceneTree.push(scene);
  }

  public async _popScene() {
    if (this._sceneTree.length > 1) this._sceneTree.pop();
  }

  public async _removeScene(scene: GameScene) {
    this._sceneTree = this._sceneTree.filter((existingScene) => existingScene !== scene);
  }

  public async _updateGame() {
    const now = performance.now();
    const delta = (now - this._lastTs) / 1000;
    this._lastTs = now;

    if (!this._sceneTree.length) return;

    for (const scene of this._sceneTree) {
      if (!scene._paused) {
        scene._update(this._dataFromWindow, delta);
      }

      if (scene._done) { this._sceneRemoveList.add(scene); }
    }

    const rootSprites = [];
    for (const scene of this._sceneTree) {
      rootSprites.push(scene._rootSprite);
    }

    const renderData = Renderer._buildRenderData(rootSprites);
    this._updateWindow(renderData);
  }
}

export default GameWorker;
