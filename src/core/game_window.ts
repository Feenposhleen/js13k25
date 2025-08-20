import AssetLibrary from "./asset_library";
import { TransferDataFromWorker } from "./game_worker";
import createRenderer, { Renderer } from "./renderer";
import createMiniSequencer, { MiniSequencer } from "./sound";
import utils, { Vec } from "./utils";

export type Pointer = {
  _coord: Vec;
  _down: boolean;
  buttonIndex?: number;
}

export type TransferDataFromWindow = {
  _keys: Record<string, boolean>;
  _pointer: Pointer;
}

const createGameWindow = () => {
  const _keysDown: Record<string, boolean> = {};
  const _canvas = utils.$('#c') as HTMLCanvasElement;
  const scriptContent = (utils.$('#j') as HTMLScriptElement).innerHTML;
  const _jsUrl = URL.createObjectURL(new Blob([scriptContent], { type: 'text/javascript' }));
  const _worker: Worker = new Worker(_jsUrl);
  const playButton = utils.$('#p') as HTMLDivElement;
  let _pixelMultiplier = 1;
  let _renderer: Renderer | null = null;
  let _pendingFrame: Float32Array | null = null;
  let _transferData: TransferDataFromWindow = { _keys: {}, _pointer: { _coord: [0, 0], _down: false } };
  let _music: MiniSequencer | null = null;
  let _sfx: MiniSequencer | null = null;

  const _requestNewFrame = () => {
    _worker.postMessage(_transferData);
    _transferData._keys = _keysDown;
  };

  const _receiveFrame = (data: TransferDataFromWorker) => {
    _pendingFrame = data.renderArray;
  };

  const _wireInput = () => {
    window.onpointermove = (ev: PointerEvent) => {
      _transferData._pointer._coord = [
        ev.clientX / _pixelMultiplier,
        ev.clientY / _pixelMultiplier,
      ];
    };

    window.onpointerdown = (ev: PointerEvent) => {
      _transferData._pointer._down = true;
    };

    window.onpointerup = (ev: PointerEvent) => {
      _transferData._pointer._down = false;
    };

    window.addEventListener('keydown', (ev) => {
      _transferData._keys[ev.key] = true;
      _keysDown[ev.key] = true;
    });

    window.addEventListener('keyup', (ev) => {
      _keysDown[ev.key] = false;
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
    await AssetLibrary._preRenderTextures();

    playButton.style.display = 'block';
    playButton.addEventListener('click', _start);
  }

  const _start = async (): Promise<void> => {
    playButton.style.display = 'none';

    const audioCtx = new window.AudioContext();
    _music = createMiniSequencer(audioCtx);
    _sfx = createMiniSequencer(audioCtx);

    // _music.playLoop({
    //   bpm: 180,
    //   bass: [
    //     0, 1, 0, 0,
    //     1, 0, 0, 0,
    //     0, 0, 0, 0,
    //     1, 0, 0, 0,
    //   ],
    //   snare: [
    //     0, 0, 1, 0,
    //     0, 0, 1, 0,
    //   ],
    //   chords: [
    //     1, 0, 0, 0,
    //     0, 0, 0, 0,
    //     1, 0, 1, 0,
    //   ],
    //   kick: [
    //     1, 0, 0, 0,
    //     0, 1, 0, 0,
    //   ],
    // });

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