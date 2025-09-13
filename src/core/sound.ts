import { utils } from "./utils";

export type PlayOptions = {
  _octave?: number;
  _bass?: number[];
  _chords?: number[];
  _snare?: number[];
  _kick?: number[];
  _beep?: number[];
  _boop?: number[];
  _bang?: number[];
};

type PlayOptionsHard = {
  _octave: number;
  _bass: number[];
  _chords: number[];
  _snare: number[];
  _kick: number[];
  _beep: number[];
  _boop: number[];
  _bang: number[];
};

const createMiniSequencer = (ctxArg?: AudioContext) => {
  const _ctx: AudioContext = ctxArg || new (window.AudioContext || (window as any).webkitAudioContext)();

  let _timer: number | null = null;
  let _lookahead = 0.12;  // seconds to schedule ahead
  let _stepDur = 0.125;   // set in playLoop
  let _step = 0;
  let _nextTime = 0;
  let _opts: PlayOptionsHard | null = null;
  let _steps = 8;

  const _minorSemis = (deg: number) => {
    const scale = [0, 2, 3, 5, 7, 8, 10];
    return 12 * Math.floor(deg / 7) + scale[deg % 7];
  };

  const _freqFromDegree = (deg: number, octave: number, rootA = 55) => {
    const base = rootA * Math.pow(2, octave); // A(55Hz) * 2^oct
    return base * Math.pow(2, _minorSemis(deg) / 12);
  };

  // For minification ---
  const _createGain = (tStart: number, inAt: number, outAt: number, value: number = 0.6): GainNode => {
    const g = _ctx.createGain();
    g.gain.setValueAtTime(0.0001, tStart);
    g.gain.exponentialRampToValueAtTime(value, tStart + inAt);
    g.gain.exponentialRampToValueAtTime(0.0001, tStart + outAt);
    return g;
  }

  const _createBiquadFilter = (t: number, type: BiquadFilterType, frequency: number): BiquadFilterNode => {
    const bp = _ctx.createBiquadFilter();
    bp.type = type;
    bp.frequency.setValueAtTime(frequency, t);
    return bp;
  }

  const _createOscillator = (t: number, type: OscillatorType, frequency: number): OscillatorNode => {
    const o = _ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(frequency, t);
    return o;
  };

  const _chain = (nodes: (AudioNode | AudioDestinationNode)[]): void => {
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }
  }

  const _startAndStop = (node: OscillatorNode, tStart: number, tStop: number): void => {
    node.start(tStart);
    node.stop(tStop);
  }

  // /---

  const _snare = (t: number) => {
    const o = _createOscillator(t, "square", _freqFromDegree(2, 2));
    const g = _createGain(t, 0.002, 0.15, 0.1);

    o.frequency.exponentialRampToValueAtTime(60 + ((_step % 8) * 4), t + 0.1);

    _chain([o, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.1);
  };

  const _kick = (t: number) => {
    const o = _createOscillator(t, "sine", _freqFromDegree(2, 1));
    const f = _createBiquadFilter(t, "lowpass", 900);
    const g = _createGain(t, 0.002, 0.2);

    _chain([o, f, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.2);
  };

  const _bass = (t: number, octave: number) => {
    const o = _createOscillator(t, "sawtooth", _freqFromDegree(_step % 16, octave - 1));
    const f = _createBiquadFilter(t, "lowpass", 600);
    const g = _createGain(t, 0.01, 0.6)

    _chain([o, f, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.6);
  };

  const _beep = (t: number, octave: number) => {
    const o = _createOscillator(t, "sine", _freqFromDegree(4, octave + 1));
    const g = _createGain(t, 0.04, 0.6)

    _chain([o, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.6);
  };

  const _boop = (t: number, octave: number) => {
    const o = _createOscillator(t, "triangle", _freqFromDegree(2, octave));
    const g = _createGain(t, 0.04, 0.2)

    _chain([o, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.2);
  };

  const _bang = (t: number, octave: number) => {
    const o = _createOscillator(t, "sawtooth", _freqFromDegree(4, octave - 1));
    const g = _createGain(t, 0.04, 2, 0.3)

    _chain([o, g, _ctx.destination]);
    _startAndStop(o, t, t + 2);
  };

  const _chord = (t: number, octave: number) => {
    const degrees = [0, 2, 4];

    const g = _createGain(t, 0.04, 1.2, 0.06);
    _chain([g, _ctx.destination]);

    degrees.forEach((d, i) => {
      const o = _createOscillator(t, "sine", _freqFromDegree(d, 2 + Math.round((_step % 8) / 2)));
      o.detune.setValueAtTime(i + 2, t);
      _chain([o, g]);
      _startAndStop(o, t, t + 1.2);
    });
  };

  const _schedule = () => {
    if (!_opts) return;
    while (_nextTime < _ctx.currentTime + _lookahead) {
      const i = _step % _steps;
      const t = _nextTime;

      if (_opts._kick[i % _opts._kick.length]) _kick(t);
      if (_opts._snare[i % _opts._snare.length]) _snare(t);
      if (_opts._bass[i % _opts._bass.length]) _bass(t, _opts._octave);
      if (_opts._beep[i % _opts._beep.length]) _beep(t, _opts._octave);
      if (_opts._boop[i % _opts._boop.length]) _boop(t, _opts._octave);
      if (_opts._bang[i % _opts._bang.length]) _bang(t, _opts._octave);
      if (_opts._chords[i % _opts._chords.length]) _chord(t, _opts._octave);

      _nextTime += _stepDur;
      _step++;
    }
  };

  const toHardOpts = (playOpts: PlayOptions): PlayOptionsHard => ({
    _octave: playOpts._octave || 1,
    _bass: playOpts._bass || [],
    _chords: playOpts._chords || [],
    _snare: playOpts._snare || [],
    _kick: playOpts._kick || [],
    _beep: playOpts._beep || [],
    _boop: playOpts._boop || [],
    _bang: playOpts._bang || [],
  });

  const playSingle = (playOpts: PlayOptions) => {
    const opts = toHardOpts(playOpts);
    const t = _ctx.currentTime;
    const d = 0;

    if (opts._kick[0]) _kick(t);
    if (opts._snare[0]) _snare(t);
    if (opts._bass[0]) _bass(t, opts._octave);
    if (opts._chords[0]) _chord(t, opts._octave);
    if (opts._beep[0]) _beep(t, opts._octave);
    if (opts._boop[0]) _boop(t, opts._octave);
    if (opts._bang[0]) _bang(t, opts._octave);
  }

  const playLoop = (playOpts: PlayOptions) => {
    _opts = toHardOpts(playOpts);

    _steps = utils._max(
      _opts._bass.length,
      _opts._chords.length,
      _opts._snare.length,
      _opts._kick.length,
      _opts._beep.length,
      _opts._boop.length,
      _opts._bang.length,
      8,
    );

    const spb = 60 / 164;
    _stepDur = spb / 2;

    if (!_timer) {
      _timer = window.setInterval(() => _schedule(), 25);
    }
  };

  const stop = () => {
    if (_timer) clearInterval(_timer);
    _timer = null;
  };

  return {
    playLoop,
    playSingle,
    stop,
  };
};

export type MiniSequencer = ReturnType<typeof createMiniSequencer>;

export default createMiniSequencer;