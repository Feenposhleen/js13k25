import AssetLibrary from "./asset_library";
import { MAX_SPRITE_COUNT, FLOATS_PER_INSTANCE, RENDERER_ASPECT } from "./config";
import { TransferDataFromWorker } from "./game_worker";
import createRenderer, { Renderer } from "./renderer";
import createMiniSequencer, { MiniSequencer } from "./sound";
import { utils, Vec } from "./utils";

export type Pointer = {
  _coord: Vec;
  _down: boolean;
  _buttonIndex?: number;
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
  let _canvasRect = _canvas.getBoundingClientRect();
  const scriptContent = (utils.$('#j') as HTMLScriptElement).innerHTML;
  const _jsUrl = URL.createObjectURL(new Blob([scriptContent], { type: 'text/javascript' }));
  const _worker: Worker = new Worker(_jsUrl);
  const playButton = utils.$('#p') as HTMLDivElement;

  // Input
  let _pointer: Pointer = { _coord: [0, 0], _down: false };
  let _keysDown: Record<string, boolean> = {};
  let _keyTaps: Record<string, boolean> = {};

  // Rendering
  let _renderer: Renderer | null = null;
  let _freeRenderBuffer: Float32Array | null = new Float32Array(MAX_SPRITE_COUNT * FLOATS_PER_INSTANCE);

  // Audio
  let _music: MiniSequencer | null = null;
  let _sfx: MiniSequencer | null = null;

  _worker.onmessage = (ev: MessageEvent<TransferDataFromWorker>) => {
    _receiveFrame(ev.data);
  };

  const _receiveFrame = (data: TransferDataFromWorker) => {
    if (data._renderArray) {
      _drawFrame(data._renderArray, data._spriteCount);
      _freeRenderBuffer = data._renderArray;
    }
  };

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

  const _drawFrame = (buffer: Float32Array, spriteCount: number) => {
    _renderer!._draw(buffer, spriteCount);
    _freeRenderBuffer = buffer;
  };

  // Resize the _canvas to be as big as possible while maintaining aspect ratio
  const _onResize = () => {
    _canvasRect = _canvas.getBoundingClientRect();
  };

  const _wireInput = () => {
    window.onresize = _onResize;

    window.onpointermove = (ev: PointerEvent) => {
      _pointer._coord[0] = utils._clamp((ev.clientX - _canvasRect.left) / _canvasRect.width, 0, 1);
      _pointer._coord[1] = utils._clamp((ev.clientY - _canvasRect.top) / _canvasRect.height, 0, 1);
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

    requestAnimationFrame(_renderLoop);
  };

  const _initialize = async (): Promise<void> => {
    await AssetLibrary._preRenderTextures();

    playButton.addEventListener('click', _start);

    utils._wait(1).then(() => {
      playButton.style.display = 'block';
      _onResize();
    });
  }

  const _start = async (): Promise<void> => {
    playButton.style.display = 'none';

    const audioCtx = new window.AudioContext();
    _music = createMiniSequencer(audioCtx);
    _sfx = createMiniSequencer(audioCtx);

    if (window.matchMedia("(pointer: coarse)").matches) {
      const doc = document.documentElement;
      doc.requestFullscreen();
    }

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

  _wireInput();

  return {
    _initialize,
  }
}

export type GameWindow = ReturnType<typeof createGameWindow>;

export default createGameWindow;