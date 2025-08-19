import spriteVS_src from './glsl/sprite_shader.vs';
import spriteFS_src from './glsl/sprite_shader.fs';
import Utils from './utils';
import { Sprite } from './sprite';
import AssetLibrary from './asset_library';

export type RenderTarget = { fb: WebGLFramebuffer | null; tex: WebGLTexture | null; width: number; height: number };

const FLOATS_PER_INSTANCE = 10; // mat3 (9) + layer (1)
const BYTES_PER_INSTANCE = FLOATS_PER_INSTANCE * 4;

export const _buildRenderData = (sprites: Sprite[]) => {
  const flat: { mat: Float32Array; z: number; layer: number }[] = [];

  const walk = (sprite: Sprite, parentMat: Float32Array | null) => {
    const x = sprite._position[0]!;
    const y = sprite._position[1]!;
    const angle = sprite._angle || 0;
    const z = sprite._z;

    const sx = sprite._scale[0];
    const sy = sprite._scale[1];

    let local = Utils._mat3FromTRS(x, y, angle, sx, sy);
    const world = parentMat ? Utils._mat3Multiply(new Float32Array(9), parentMat, local) : local;

    const texHalf = 50; // textures are 100x100
    const texScale = new Float32Array([
      texHalf, 0, 0,
      0, texHalf, 0,
      0, 0, 1
    ]);
    const worldWithTex = Utils._mat3Multiply(new Float32Array(9), world, texScale);

    // pixel -> clip (hardcoded viewport used here as in original)
    const pxToClip = new Float32Array([2 / 600, 0, 0, 0, -2 / 400, 0, -1, 1, 1]);
    const clipMat = Utils._mat3Multiply(new Float32Array(9), pxToClip, worldWithTex);

    flat.push({ mat: clipMat, z, layer: sprite._texture });

    if (sprite._children) for (const c of sprite._children) walk(c, world);
  };

  for (const s of sprites) walk(s, null);
  flat.sort((a, b) => a.z - b.z);

  const data = new Float32Array(flat.length * FLOATS_PER_INSTANCE);
  let i = 0;
  for (const s of flat) {
    data[i++] = s.mat[0]; data[i++] = s.mat[1]; data[i++] = s.mat[2];
    data[i++] = s.mat[3]; data[i++] = s.mat[4]; data[i++] = s.mat[5];
    data[i++] = s.mat[6]; data[i++] = s.mat[7]; data[i++] = s.mat[8];
    data[i++] = s.layer | 0;
  }
  return data;
};

// Keep a named export compatible with existing imports that expect Renderer._buildRenderData
export const Renderer = { _buildRenderData };

// Closure creator (in the same style as createGameWorker)
export const createRenderer = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
  if (!gl) throw new Error("WebGL2 required");

  // small GL helpers (inner so they can capture `gl`)
  const _compileShader = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
    return sh;
  };

  const _createProgram = (vs: string, fs: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, _compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, _compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    const progLog = gl.getProgramInfoLog(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(progLog || undefined);
    return p;
  };

  const _fsQuadVS = () => `#version 300 es
const vec2 POS[4]=vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));
out vec2 vUV; void main(){ vec2 p = POS[gl_VertexID]; vUV=(p+1.)*.5; gl_Position=vec4(p,0,1);} `;

  const _grayscaleFS = () => `#version 300 es
precision mediump float; in vec2 vUV; uniform sampler2D uTexture; out vec4 fragColor; void main(){ vec4 c=texture(uTexture,vUV); float g=dot(c.rgb,vec3(.299,.587,.114)); fragColor=vec4(vec3(g),c.a);} `;

  const _instAttrib = (loc: number, size: number, offset: number) => {
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, BYTES_PER_INSTANCE, offset);
    gl.vertexAttribDivisor(loc, 1);
  };

  const _createRenderTarget = (w: number, h: number): RenderTarget => {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex, width: w, height: h };
  };

  // instance state
  const spriteProgram = _createProgram(spriteVS_src, spriteFS_src);
  gl.useProgram(spriteProgram);

  gl.uniform1i(gl.getUniformLocation(spriteProgram, "uTexArray"), 0);

  const instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);

  const locTransform = gl.getAttribLocation(spriteProgram, "aTransform");
  _instAttrib(locTransform, 3, 0);
  _instAttrib(locTransform + 1, 3, 12);
  _instAttrib(locTransform + 2, 3, 24);
  const locLayer = gl.getAttribLocation(spriteProgram, "aLayer");
  _instAttrib(locLayer, 1, 36);

  const fsQuadVS = _fsQuadVS();
  const postPrograms: WebGLProgram[] = [_createProgram(fsQuadVS, _grayscaleFS())];

  let targetA: RenderTarget | null = _createRenderTarget(canvas.width, canvas.height);
  let targetB: RenderTarget | null = _createRenderTarget(canvas.width, canvas.height);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const loadTextureArray = () => {
    const images = [...AssetLibrary._textureCache.values()];
    if (!images.length) return null;

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

  const runPostChain = (srcTex: WebGLTexture | null, width: number, height: number) => {
    let readTex = srcTex, write = targetB!;
    for (let i = 0; i < postPrograms.length; i++) {
      const prog = postPrograms[i];
      gl.useProgram(prog);
      gl.uniform1i(gl.getUniformLocation(prog, "uTexture"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      const isLast = (i === postPrograms.length - 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, isLast ? null : write.fb);
      gl.viewport(0, 0, width, height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      readTex = write.tex;
      write = (write === targetA) ? targetB! : targetA!;
    }
  };

  // initial texture array load (if assets ready)
  loadTextureArray();

  const _draw = (drawData: Float32Array) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.DYNAMIC_DRAW);
    gl.useProgram(spriteProgram);

    if (!targetA) throw new Error('render targets not created');
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetA.fb);
    gl.viewport(0, 0, targetA.width, targetA.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const instanceCount = drawData.length / FLOATS_PER_INSTANCE;
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);

    runPostChain(targetA.tex, targetA.width, targetA.height);
  };

  // public API
  return {
    _draw,
    _reloadTextures: loadTextureArray,
    _buildRenderData,
  };
};

export type Renderer = ReturnType<typeof createRenderer>;

export default createRenderer;