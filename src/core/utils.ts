export type Vec = [number, number];

export class Utils {

  // Randomizers

  static rndFloat(): number {
    return Math.random();
  }

  static rndOne(): number {
    return (Utils.rndFloat() - 0.5) * 2;
  }

  static rndRange(point: number, spread = 10): number {
    return point + (Utils.rndOne() * spread);
  }

  static rndInt(max: number, min = 0): number {
    return Math.floor((Utils.rndFloat() * (max - min)) + min);
  }

  static rndRadius(pos: Vec, radius = 10): Vec {
    return [Utils.rndRange(pos[0], radius), Utils.rndRange(pos[1], radius)];
  }

  // Distances

  static numberDistance(num1: number, num2: number): number {
    return Math.abs(num1 - num2);
  }

  static vectorDistance(pos1: Vec, pos2: Vec): number {
    return Math.max(
      Utils.numberDistance(pos1[0], pos2[0]),
      Utils.numberDistance(pos1[1], pos2[1]),
    );
  }

  // Vector operations

  static vectorIntersects(subjectPos: Vec, boxPos: Vec, boxRadius: number): boolean {
    const dist = Utils.vectorDistance(subjectPos, boxPos);
    return (dist < boxRadius);
  }

  static vectorAdd(pos1: Vec, pos2: Vec): Vec {
    return [
      pos1[0] + pos2[0],
      pos1[1] + pos2[1],
    ];
  }

  static vectorAngle(pos1: Vec, pos2: Vec): number {
    return Math.atan2(pos1[0] - pos2[0], pos1[1] - pos2[1]);
  }

  static vectorLength(vector: Vec): number {
    return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
  }

  static vectorRotate(vector: Vec, rotation: number): Vec {
    return [
      (vector[0] * Math.cos(rotation)) - (vector[1] * Math.sin(rotation)),
      (vector[0] * Math.sin(rotation)) - (vector[1] * Math.cos(rotation)),
    ];
  }

  // mat3 helpers (column-major)

  static mat3Multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
    const a00 = a[0], a10 = a[1], a20 = a[2], a01 = a[3], a11 = a[4], a21 = a[5], a02 = a[6], a12 = a[7], a22 = a[8];
    const b00 = b[0], b10 = b[1], b20 = b[2], b01 = b[3], b11 = b[4], b21 = b[5], b02 = b[6], b12 = b[7], b22 = b[8];
    out[0] = a00 * b00 + a01 * b10 + a02 * b20;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20;
    out[3] = a00 * b01 + a01 * b11 + a02 * b21;
    out[4] = a10 * b01 + a11 * b11 + a12 * b21;
    out[5] = a20 * b01 + a21 * b11 + a22 * b21;
    out[6] = a00 * b02 + a01 * b12 + a02 * b22;
    out[7] = a10 * b02 + a11 * b12 + a12 * b22;
    out[8] = a20 * b02 + a21 * b12 + a22 * b22;
    return out;
  }

  static mat3FromTRS(tx: number, ty: number, angle: number, sx: number, sy: number) {
    const c = Math.cos(angle || 0), s = Math.sin(angle || 0);
    const r00 = c * sx, r10 = s * sx;
    const r01 = -s * sy, r11 = c * sy;
    const out = new Float32Array(9);
    out[0] = r00; out[1] = r10; out[2] = 0;
    out[3] = r01; out[4] = r11; out[5] = 0;
    out[6] = tx; out[7] = ty; out[8] = 1;
    return out;
  }
}

export default Utils;