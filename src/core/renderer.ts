import spriteVS_src from './glsl/sprite_shader.vs';
import spriteFS_src from './glsl/sprite_shader.fs';
import Utils from './utils';
import Sprite from './sprite';
import AssetLibrary from './asset_library';

export type RenderTarget = { fb: WebGLFramebuffer | null; tex: WebGLTexture | null; width: number; height: number };

export class Renderer {
  static _floatsPerInstance = 10; // mat3 (9) + layer (1)
  static _bytesPerInstance = Renderer._floatsPerInstance * 4;

  private _gl: WebGL2RenderingContext;

  private _spriteProgram: WebGLProgram;
  private _instanceBuffer: WebGLBuffer | null;

  private _targetA: RenderTarget | null = null;
  private _targetB: RenderTarget | null = null;
  private _postPrograms: WebGLProgram[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) throw new Error("WebGL2 required");
    this._gl = gl;

    // compile programs
    this._spriteProgram = this._createProgram(spriteVS_src, spriteFS_src);
    gl.useProgram(this._spriteProgram);

    // uniforms
    gl.uniform1i(gl.getUniformLocation(this._spriteProgram, "uTexArray"), 0);

    // instance buffer
    this._instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);

    // setup attributes: aTransform (mat3 -> 3 vec3 attribs) and aLayer
    const locTransform = gl.getAttribLocation(this._spriteProgram, "aTransform");
    this._instAttrib(locTransform, 3, 0);
    this._instAttrib(locTransform + 1, 3, 12);
    this._instAttrib(locTransform + 2, 3, 24);
    const locLayer = gl.getAttribLocation(this._spriteProgram, "aLayer");
    this._instAttrib(locLayer, 1, 36);

    // post programs (example grayscale)
    const fsQuadVS = this._fsQuadVS();
    this._postPrograms = [this._createProgram(fsQuadVS, this._grayscaleFS())];

    // prepare render targets
    this._targetA = this._createRenderTarget(canvas.width, canvas.height);
    this._targetB = this._createRenderTarget(canvas.width, canvas.height);

    // enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this._loadTextureArray();
  }
  // ...existing code...
  static _buildRenderData(sprites: Sprite[]) {
    const flat: { mat: Float32Array; z: number; layer: number }[] = [];
    // ...existing code...
    const walk = (sprite: Sprite, parentMat: Float32Array | null) => {
      const x = sprite._position[0]!;
      const y = sprite._position[1]!;
      const angle = sprite._angle || 0;
      const z = sprite._z;

      // sprite._scale is an array [sx, sy] that multiplies the texture size.
      const sx = sprite._scale[0];
      const sy = sprite._scale[1];

      // build local WITHOUT the texture half-size (so it won't be compounded down the tree)
      let local = Utils.mat3FromTRS(x, y, angle, sx, sy);
      // world (in "unit" sprite space) used for recursion
      const world = parentMat ? Utils.mat3Multiply(new Float32Array(9), parentMat, local) : local;

      // apply texture half-size once to the world matrix for this instance only
      const texHalf = 50; // textures are 100x100
      const texScale = new Float32Array([
        texHalf, 0, 0,
        0, texHalf, 0,
        0, 0, 1
      ]);
      const worldWithTex = Utils.mat3Multiply(new Float32Array(9), world, texScale);

      // pixel -> clip
      const pxToClip = new Float32Array([2 / 600, 0, 0, 0, -2 / 400, 0, -1, 1, 1]);
      const clipMat = Utils.mat3Multiply(new Float32Array(9), pxToClip, worldWithTex);

      flat.push({ mat: clipMat, z, layer: sprite._texture });

      if (sprite._children) for (const c of sprite._children) walk(c, world);
    };
    // ...existing code...

    for (const s of sprites) walk(s, null);
    flat.sort((a, b) => a.z - b.z);

    const data = new Float32Array(flat.length * Renderer._floatsPerInstance);
    let i = 0;
    for (const s of flat) {
      // pack columns
      data[i++] = s.mat[0]; data[i++] = s.mat[1]; data[i++] = s.mat[2];
      data[i++] = s.mat[3]; data[i++] = s.mat[4]; data[i++] = s.mat[5];
      data[i++] = s.mat[6]; data[i++] = s.mat[7]; data[i++] = s.mat[8];
      data[i++] = s.layer | 0;
    }
    return data;
  }
  // ...existing code...
  _draw(drawData: Float32Array) {
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.DYNAMIC_DRAW);
    gl.useProgram(this._spriteProgram);

    // render to offscreen targetA
    if (!this._targetA) throw new Error('render targets not created');
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._targetA.fb);
    gl.viewport(0, 0, this._targetA.width, this._targetA.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const instanceCount = drawData.length / Renderer._floatsPerInstance;
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);

    // post chain to screen
    this._runPostChain(this._targetA.tex, this._targetA.width, this._targetA.height);
  }

  // --- helpers & internals ---
  private _instAttrib(loc: number, size: number, offset: number) {
    const gl = this._gl;
    if (loc < 0) return; // inactive
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, Renderer._bytesPerInstance, offset);
    gl.vertexAttribDivisor(loc, 1);
  }

  private _fsQuadVS() {
    return `#version 300 es
const vec2 POS[4]=vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));
out vec2 vUV; void main(){ vec2 p = POS[gl_VertexID]; vUV=(p+1.)*.5; gl_Position=vec4(p,0,1);} `;
  }
  private _grayscaleFS() {
    return `#version 300 es
precision mediump float; in vec2 vUV; uniform sampler2D uTexture; out vec4 fragColor; void main(){ vec4 c=texture(uTexture,vUV); float g=dot(c.rgb,vec3(.299,.587,.114)); fragColor=vec4(vec3(g),c.a);} `;
  }

  private _createRenderTarget(w: number, h: number): RenderTarget {
    const gl = this._gl;
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex, width: w, height: h };
  }

  private _runPostChain(srcTex: WebGLTexture | null, width: number, height: number) {
    const gl = this._gl;
    let readTex = srcTex, write = this._targetB!;
    for (let i = 0; i < this._postPrograms.length; i++) {
      const prog = this._postPrograms[i];
      gl.useProgram(prog);
      gl.uniform1i(gl.getUniformLocation(prog, "uTexture"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      const isLast = (i === this._postPrograms.length - 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, isLast ? null : write.fb);
      gl.viewport(0, 0, width, height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      readTex = write.tex;
      write = (write === this._targetA) ? this._targetB! : this._targetA!;
    }
  }

  private _loadTextureArray() {
    const gl = this._gl;

    const images = [...AssetLibrary._textureCache.values()];

    const w = images[0].width,
      h = images[0].height,
      layers = images.length;

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, w, h, layers, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    for (let i = 0; i < layers; i++) {
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, w, h, 1, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    }

    return { tex, width: w, height: h, layers };
  };

  // small GL helpers
  private _compileShader(type: number, src: string) {
    const gl = this._gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
    return sh;
  }

  private _createProgram(vs: string, fs: string) {
    const gl = this._gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this._compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this._compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    const progLog = gl.getProgramInfoLog(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(progLog || undefined);
    return p;
  }
}