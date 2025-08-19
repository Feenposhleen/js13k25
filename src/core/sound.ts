type PlayOptions = {
  bpm: number;
  octave: number;
  bass: number[];
  chords: number[];
  snare: number[];
  kick: number[];
};

class MiniSequencer {
  ctx: AudioContext;
  timer: number | null = null;
  lookahead = 0.12;  // seconds to schedule ahead
  stepDur = 0.125;   // set in playLoop
  step = 0;
  nextTime = 0;
  opts: PlayOptions | null = null;
  _steps = 8;

  constructor(ctx: AudioContext) {
    this.ctx = ctx || new window.AudioContext();
    this.lookahead = 0.12;  // seconds to schedule ahead
  }

  // ---- musical helpers ----
  _minorSemis(deg: number) {
    const scale = [0, 2, 3, 5, 7, 8, 10];
    return 12 * Math.floor(deg / 7) + scale[deg % 7];
  }

  _freqFromDegree(deg: number, octave: number, rootA = 55) {
    const base = rootA * Math.pow(2, octave); // A(55Hz) * 2^oct
    return base * Math.pow(2, this._minorSemis(deg) / 12);
  }

  // ---- instruments (procedural) ----
  _kick(t: number) {
    const o = this.ctx.createOscillator(); o.type = "sine";
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.16);
  }

  _snare(t: number) {
    const dur = 0.12;
    // noise burst
    const nbuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = nbuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const nsrc = this.ctx.createBufferSource(); nsrc.buffer = nbuf;

    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(1800, t);
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.setValueAtTime(200, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    nsrc.connect(bp).connect(hp).connect(g).connect(this.ctx.destination);
    nsrc.start(t); nsrc.stop(t + dur);

    // snare body (brief tone)
    const o = this.ctx.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(180, t);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.3, t + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g2).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.09);
  }

  _bass(t: number, deg: number, octave: number) {
    const o = this.ctx.createOscillator(); o.type = "sawtooth";
    const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(400, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.frequency.setValueAtTime(this._freqFromDegree(deg, octave), t);
    o.connect(f).connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.3);
  }

  _chord(t: number, deg: number, octave: number) {
    const degrees = [deg, deg + 2, deg + 4]; // simple triad in (natural minor) scale degrees
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    g.connect(this.ctx.destination);

    degrees.forEach((d, i) => {
      const o = this.ctx.createOscillator(); o.type = "triangle";
      const freq = this._freqFromDegree(d, octave + 1);
      o.frequency.setValueAtTime(freq, t);
      o.detune.setValueAtTime((i - 1) * 4, t); // slight spread
      o.connect(g); o.start(t); o.stop(t + 0.62);
    });
  }

  // ---- scheduler ----
  _schedule() {
    while (this.nextTime < this.ctx.currentTime + this.lookahead) {
      const i = this.step % this._steps;
      const t = this.nextTime;
      const d = i; // use step index as degree (simple motion)
      const { octave, bass, chords, snare, kick } = this.opts!;

      if (kick[i]) this._kick(t);
      if (snare[i]) this._snare(t);
      if (bass[i]) this._bass(t, d, octave);
      if (chords[i]) this._chord(t, d, octave);

      this.nextTime += this.stepDur;
      this.step++;
    }
  }

  playLoop(opts: PlayOptions) {
    this.opts = opts;
    this._steps = Math.max(
      this.opts!.bass.length,
      this.opts!.chords.length,
      this.opts!.snare.length,
      this.opts!.kick.length,
      8,
    );

    const spb = 60 / this.opts.bpm;
    // 8 steps per bar (eighth-notes in 4/4): 1 step = spb/2
    this.stepDur = spb / 2;

    if (this.ctx.state === "suspended") this.ctx.resume();
    if (this.timer) clearInterval(this.timer);
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;

    this.timer = setInterval(() => this._schedule(), 25);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export default MiniSequencer;