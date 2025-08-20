import AssetLibrary from "./asset_library";
import { TransferDataFromWorker } from "./game_worker";
import createRenderer, { Renderer } from "./renderer";
import createMiniSequencer, { MiniSequencer } from "./sound";
import utils, { Vec } from "./utils";

export type TransferDataFromWindow = {
  keys: Record<string, boolean>;
  pointer: Vec | null;
}

const createGameWindow = () => {
  const _canvas = utils.$('#c') as HTMLCanvasElement;
  const scriptContent = (utils.$('#j') as HTMLScriptElement).innerHTML;
  const _jsUrl = URL.createObjectURL(new Blob([scriptContent], { type: 'text/javascript' }));
  const _worker: Worker = new Worker(_jsUrl);
  const playButton = utils.$('#p') as HTMLDivElement;
  let _pixelMultiplier = 1;
  let _renderer: Renderer | null = null;
  let _pendingFrame: Float32Array | null = null;
  let _transferData: TransferDataFromWindow = { keys: {}, pointer: null };
  let _music: MiniSequencer | null = null;
  let _sfx: MiniSequencer | null = null;

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

  const _initialize = async (): Promise<void> => {
    const audioCtx = new window.AudioContext();
    _music = createMiniSequencer(audioCtx);
    _sfx = createMiniSequencer(audioCtx);

    await AssetLibrary._preRenderTextures();

    playButton.style.display = 'block';
    playButton.addEventListener('click', _start);
  }

  const _start = async (): Promise<void> => {
    playButton.style.display = 'none';
    _renderer = createRenderer(_canvas);
    _requestNewFrame();
    _renderLoop();
  };

  _worker.onmessage = (ev: MessageEvent<TransferDataFromWorker>) => {
    _receiveFrame(ev.data);
  };

  _wireInput();

  return {
    _initialize,
  }
}

export type GameWindow = ReturnType<typeof createGameWindow>;

export default createGameWindow;