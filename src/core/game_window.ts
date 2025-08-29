import AssetLibrary from "./asset_library";
import { TransferDataFromWorker } from "./game_worker";
import createRenderer, { BYTES_PER_INSTANCE, FLOATS_PER_INSTANCE, MAX_SPRITE_COUNT, Renderer } from "./renderer";
import createMiniSequencer, { MiniSequencer } from "./sound";
import { utils, Vec } from "./utils";

export type Pointer = {
  _coord: Vec;
  _down: boolean;
  buttonIndex?: number;
}

export type InputState = {
  _keys: Record<string, boolean>;
  _pointer: Pointer;
}

export type TransferDataFromWindow = {
  _freeRenderBuffer: Float32Array;
  _input: InputState;
}

const createGameWindow = () => {
  // Elements
  const _canvas = utils.$('#c') as HTMLCanvasElement;
  const scriptContent = (utils.$('#j') as HTMLScriptElement).innerHTML;
  const _jsUrl = URL.createObjectURL(new Blob([scriptContent], { type: 'text/javascript' }));
  const _worker: Worker = new Worker(_jsUrl);
  const playButton = utils.$('#p') as HTMLDivElement;

  // Input
  let _pointer: Pointer = { _coord: [0, 0], _down: false };
  let _keysDown: Record<string, boolean> = {};
  let _keyTaps: Record<string, boolean> = {};

  // Rendering
  let _pixelMultiplier = 1;
  let _renderer: Renderer | null = null;
  let _freeRenderBuffer: Float32Array | null = new Float32Array(MAX_SPRITE_COUNT * FLOATS_PER_INSTANCE);
  let _pendingRenderBuffer: Float32Array | null = null;
  let _pendingSpriteCount: number = 0;

  // Audio
  let _music: MiniSequencer | null = null;
  let _sfx: MiniSequencer | null = null;

  const _requestNewFrame = (freeRenderBuffer: Float32Array) => {
    const transferData: TransferDataFromWindow = {
      _freeRenderBuffer: freeRenderBuffer,
      _input: {
        _keys: { ..._keyTaps, ..._keysDown },
        _pointer: _pointer,
      },
    }
    _worker.postMessage(transferData, [freeRenderBuffer.buffer]);
    _keyTaps = {};
  };

  const _receiveFrame = (data: TransferDataFromWorker) => {
    if (data.renderArray) {
      _pendingRenderBuffer = data.renderArray;
      _pendingSpriteCount = data.spriteCount;
    }
  };

  const _wireInput = () => {
    window.onpointermove = (ev: PointerEvent) => {
      _pointer._coord = [
        ev.clientX / _pixelMultiplier,
        ev.clientY / _pixelMultiplier,
      ];
    };

    window.onpointerdown = (ev: PointerEvent) => {
      _pointer._down = true;
    };

    window.onpointerup = (ev: PointerEvent) => {
      _pointer._down = false;
    };

    window.addEventListener('keydown', (ev) => {
      _keyTaps[ev.key] = true;
      _keysDown[ev.key] = true;
    });

    window.addEventListener('keyup', (ev) => {
      _keysDown[ev.key] = false;
    });
  };

  const _renderLoop = () => {
    if (_freeRenderBuffer) {
      _requestNewFrame(_freeRenderBuffer);
      _freeRenderBuffer = null;
    }

    if (_pendingRenderBuffer) {
      _renderer!._draw(_pendingRenderBuffer, _pendingSpriteCount);
      _freeRenderBuffer = _pendingRenderBuffer;
      _pendingRenderBuffer = null;
      _pendingSpriteCount = 0;
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
    _requestNewFrame(new Float32Array(MAX_SPRITE_COUNT * FLOATS_PER_INSTANCE));
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