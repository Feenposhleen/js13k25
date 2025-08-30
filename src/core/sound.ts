type PlayOptions = {
  _bpm: number;
  _octave?: number;
  _bass?: number[];
  _chords?: number[];
  _snare?: number[];
  _kick?: number[];
};

type PlayOptionsHard = {
  _bpm: number;
  _octave: number;
  _bass: number[];
  _chords: number[];
  _snare: number[];
  _kick: number[];
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
    const o = _createOscillator(t, "square", 200);
    const g = _createGain(t, 0.002, 0.15, 0.2);

    o.frequency.exponentialRampToValueAtTime(40 + ((_step % _steps) * 5), t + 0.12);

    _chain([o, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.2);
  };

  const _kick = (t: number) => {
    const o = _createOscillator(t, "sine", 120);
    const g = _createGain(t, 0.002, 0.1, 0.5);

    _chain([o, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.1);
  };

  const _bass = (t: number, deg: number, octave: number) => {
    const o = _createOscillator(t, "sawtooth", _freqFromDegree(deg, octave - 1));
    const f = _createBiquadFilter(t, "lowpass", 500);
    const g = _createGain(t, 0.01, 0.4)

    _chain([o, f, g, _ctx.destination]);
    _startAndStop(o, t, t + 0.5);
  };

  const _chord = (t: number, deg: number, octave: number) => {
    const degrees = [deg, deg + 2, deg + 4];

    const g = _createGain(t, 0.04, 1, 0.05);
    _chain([g, _ctx.destination]);

    degrees.forEach((d, i) => {
      const o = _createOscillator(t, "triangle", _freqFromDegree(d, octave + 1));
      o.detune.setValueAtTime((i - 1) * 4, t);
      _chain([o, g]);
      _startAndStop(o, t, t + 1);
    });
  };

  const _schedule = () => {
    if (!_opts) return;
    while (_nextTime < _ctx.currentTime + _lookahead) {
      const i = _step % _steps;
      const t = _nextTime;
      const d = i;
      const { _octave: octave, _bass: bass, _chords: chords, _snare: snare, _kick: kick } = _opts;

      if (kick[i % kick.length]) _kick(t);
      if (snare[i % snare.length]) _snare(t);
      if (bass[i % bass.length]) _bass(t, d, octave);
      if (chords[i % chords.length]) _chord(t, d, octave);

      _nextTime += _stepDur;
      _step++;
    }
  };

  const playLoop = (playOpts: PlayOptions) => {
    _opts = {
      _octave: 1,
      _bass: [],
      _chords: [],
      _kick: [],
      _snare: [],
      ...playOpts,
    };

    _steps = Math.max(
      _opts._bass.length,
      _opts._chords.length,
      _opts._snare.length,
      _opts._kick.length,
      8,
    );

    const spb = 60 / _opts._bpm;
    _stepDur = spb / 2;

    if (_timer) clearInterval(_timer);
    _step = 0;
    _nextTime = _ctx.currentTime + 0.05;

    _timer = window.setInterval(() => _schedule(), 25);
  };

  const stop = () => {
    if (_timer) clearInterval(_timer);
    _timer = null;
  };

  return {
    playLoop,
    stop,
  };
};

export type MiniSequencer = ReturnType<typeof createMiniSequencer>;

export default createMiniSequencer;