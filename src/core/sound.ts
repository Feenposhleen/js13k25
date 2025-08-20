type PlayOptions = {
  bpm: number;
  octave: number;
  bass: number[];
  chords: number[];
  snare: number[];
  kick: number[];
};

const createMiniSequencer = (ctxArg?: AudioContext) => {
  const ctx: AudioContext = ctxArg || new (window.AudioContext || (window as any).webkitAudioContext)();

  let timer: number | null = null;
  let lookahead = 0.12;  // seconds to schedule ahead
  let stepDur = 0.125;   // set in playLoop
  let step = 0;
  let nextTime = 0;
  let opts: PlayOptions | null = null;
  let _steps = 8;

  // ---- musical helpers ----
  const _minorSemis = (deg: number) => {
    const scale = [0, 2, 3, 5, 7, 8, 10];
    return 12 * Math.floor(deg / 7) + scale[deg % 7];
  };

  const _freqFromDegree = (deg: number, octave: number, rootA = 55) => {
    const base = rootA * Math.pow(2, octave); // A(55Hz) * 2^oct
    return base * Math.pow(2, _minorSemis(deg) / 12);
  };

  // ---- instruments (procedural) ----
  const _kick = (t: number) => {
    const o = ctx.createOscillator(); o.type = "sine";
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.16);
  };

  const _snare = (t: number) => {
    const dur = 0.12;
    // noise burst
    const nbuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = nbuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const nsrc = ctx.createBufferSource(); nsrc.buffer = nbuf;

    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(1800, t);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.setValueAtTime(200, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    nsrc.connect(bp).connect(hp).connect(g).connect(ctx.destination);
    nsrc.start(t); nsrc.stop(t + dur);

    // snare body (brief tone)
    const o = ctx.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(180, t);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.3, t + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g2).connect(ctx.destination);
    o.start(t); o.stop(t + 0.09);
  };

  const _bass = (t: number, deg: number, octave: number) => {
    const o = ctx.createOscillator(); o.type = "sawtooth";
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(400, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.frequency.setValueAtTime(_freqFromDegree(deg, octave), t);
    o.connect(f).connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.3);
  };

  const _chord = (t: number, deg: number, octave: number) => {
    const degrees = [deg, deg + 2, deg + 4]; // simple triad in (natural minor) scale degrees
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    g.connect(ctx.destination);

    degrees.forEach((d, i) => {
      const o = ctx.createOscillator(); o.type = "triangle";
      const freq = _freqFromDegree(d, octave + 1);
      o.frequency.setValueAtTime(freq, t);
      o.detune.setValueAtTime((i - 1) * 4, t); // slight spread
      o.connect(g); o.start(t); o.stop(t + 0.62);
    });
  };

  // ---- scheduler ----
  const _schedule = () => {
    if (!opts) return;
    while (nextTime < ctx.currentTime + lookahead) {
      const i = step % _steps;
      const t = nextTime;
      const d = i; // use step index as degree (simple motion)
      const { octave, bass, chords, snare, kick } = opts;

      if (kick[i]) _kick(t);
      if (snare[i]) _snare(t);
      if (bass[i]) _bass(t, d, octave);
      if (chords[i]) _chord(t, d, octave);

      nextTime += stepDur;
      step++;
    }
  };

  const playLoop = (playOpts: PlayOptions) => {
    opts = playOpts;
    _steps = Math.max(
      opts.bass.length,
      opts.chords.length,
      opts.snare.length,
      opts.kick.length,
      8,
    );

    const spb = 60 / opts.bpm;
    // 8 steps per bar (eighth-notes in 4/4): 1 step = spb/2
    stepDur = spb / 2;

    if (ctx.state === "suspended") ctx.resume();
    if (timer) clearInterval(timer);
    step = 0;
    nextTime = ctx.currentTime + 0.05;

    timer = window.setInterval(() => _schedule(), 25);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  return {
    playLoop,
    stop,
  };
};

export type MiniSequencer = ReturnType<typeof createMiniSequencer>;

export default createMiniSequencer;