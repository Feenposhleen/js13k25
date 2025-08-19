import AssetLibrary from "./asset_library";
import { TransferDataFromWorker } from "./game_worker";
import createRenderer, { Renderer } from "./renderer";
import { Vec } from "./utils";

export type TransferDataFromWindow = {
  keys: Record<string, boolean>;
  pointer: Vec | null;
}

const createGameWindow = () => {
  const _canvas = document.querySelector('#c') as HTMLCanvasElement;
  const scriptContent = (document.querySelector('#j') as any).innerHTML;
  const _jsUrl = URL.createObjectURL(new Blob([scriptContent], { type: 'text/javascript' }));
  const _worker: any = new Worker(_jsUrl);
  let _pixelMultiplier = 1;
  let _renderer: Renderer | null = null;
  let _pendingFrame: Float32Array | null = null;
  let _transferData: TransferDataFromWindow = { keys: {}, pointer: null };

  const _requestNewFrame = () => {
    _worker.postMessage(_transferData);
    _transferData = { keys: {}, pointer: null };
  };

  const _receiveFrame = (data: TransferDataFromWorker) => {
    _pendingFrame = data.renderArray;
  };

  const _wireInput = () => {
    window.onpointerdown = (ev: any) => {
      _transferData.pointer = [
        ev.clientX / _pixelMultiplier,
        ev.clientY / _pixelMultiplier,
      ];
    };

    window.addEventListener('keydown', (ev) => {
      _transferData.keys[ev.key] = true;
    });
  };

  const _renderLoop = () => {
    if (_pendingFrame) {
      _requestNewFrame();
      _renderer!._draw(_pendingFrame);
      _pendingFrame = null;
    }
    requestAnimationFrame(_renderLoop);
  };

  // wire up worker -> frame receiver
  _worker.onmessage = (ev: MessageEvent<TransferDataFromWorker>) => {
    _receiveFrame(ev.data);
  };

  // start input wiring immediately
  _wireInput();

  return {
    async _start(): Promise<void> {
      await AssetLibrary._preRenderTextures();
      _renderer = createRenderer(_canvas);
      _requestNewFrame();
      _renderLoop();
    }
  }
}

export type GameWindow = ReturnType<typeof createGameWindow>;

export default createGameWindow;