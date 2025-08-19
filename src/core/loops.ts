class Loops {
  static run(
    state: any,
    cb: (state: any, dt: number) => boolean,
  ): void {
    let prevTs = performance.now();
    let dt = 0;

    const loop = (ts: number) => {
      dt = Math.min((ts - prevTs) / 1000, 0.1);
      if (cb(state, dt)) {
        requestAnimationFrame(loop);
      }
      prevTs = ts;
    }

    loop(prevTs);
  }
}

export default Loops;