import AssetLibrary from "./asset_library";
import { TransferDataFromWorker } from "./game_worker";
import { Renderer } from "./renderer";
import { Vec } from "./utils";

export type TransferDataFromWindow = {
  keys: Record<string, boolean>;
  pointer: Vec | null;
}

class GameWindow {
  private _canvas: HTMLCanvasElement;
  private _jsUrl: string;
  private _worker: any;
  private _pixelMultiplier: number = 1;
  private _renderer: Renderer | null = null;
  private _pendingFrame: Float32Array | null = null;
  private _transferData: TransferDataFromWindow = { keys: {}, pointer: null };

  constructor() {
    this._canvas = document.querySelector('#c') as HTMLCanvasElement;

    // Set up the worker
    const scriptContent = (document.querySelector('#j') as any).innerHTML;
    this._jsUrl = URL.createObjectURL(new Blob([scriptContent], { type: 'text/javascript' }));
    this._worker = new Worker(this._jsUrl);
    this._worker.onmessage = (ev: MessageEvent<TransferDataFromWorker>) => {
      this._receiveFrame(ev.data);
    };

    this._wireInput();
  }

  private _requestNewFrame() {
    this._worker.postMessage(this._transferData);
    this._transferData = { keys: {}, pointer: null }; // Reset after sending
  }

  private _receiveFrame(data: TransferDataFromWorker) {
    this._pendingFrame = data.renderArray;
  }

  private _wireInput() {
    window.onpointerdown = (ev: any) => {
      this._transferData.pointer = [
        ev.clientX / this._pixelMultiplier,
        ev.clientY / this._pixelMultiplier,
      ];
    };

    window.addEventListener('keydown', (ev) => {
      this._transferData.keys[ev.key] = true;
    });
  };

  private _renderLoop() {
    if (this._pendingFrame) {
      this._requestNewFrame();
      this._renderer!._draw(this._pendingFrame);
      this._pendingFrame = null;
    }

    requestAnimationFrame(() => this._renderLoop());
  }

  public async _start(): Promise<void> {
    await AssetLibrary._preRenderTextures();
    this._renderer = new Renderer(this._canvas);
    this._requestNewFrame();
    this._renderLoop();
  }
}

export default GameWindow;