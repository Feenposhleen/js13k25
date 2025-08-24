import spriteVS_src from './glsl/sprite_shader.vs';
import spriteFS_src from './glsl/sprite_shader.fs';
import fsQuadVs from './glsl/full_screen_quad.vs';
import postGrayscaleFs from './glsl/post_grayscale.fs';
import postNoopFs from './glsl/post_noop.fs';

import Utils from './utils';
import { Sprite } from './sprite';
import AssetLibrary from './asset_library';
import assetLibrary from './asset_library';

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

    const texHalf = assetLibrary._dimensions / 2;
    const texScale = new Float32Array([texHalf, 0, 0, 0, texHalf, 0, 0, 0, 1]);

    const worldWithTex = Utils._mat3Multiply(new Float32Array(9), world, texScale);
    const pxToClip = new Float32Array([2 / 600, 0, 0, 0, -2 / 400, 0, -1, 1, 1]);
    const clipMat = Utils._mat3Multiply(new Float32Array(9), pxToClip, worldWithTex);

    if (sprite._texture !== null) {
      flat.push({ mat: clipMat, z, layer: assetLibrary._textureIndex(sprite._texture) });
    }

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

export const createRenderer = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
  if (!gl) throw new Error("WebGL2 required");

  // WebGL context methods for minification
  const attachShader = gl.attachShader.bind(gl);
  const createBuffer = gl.createBuffer.bind(gl);
  const bindBuffer = gl.bindBuffer.bind(gl);
  const bufferData = gl.bufferData.bind(gl);
  const createFramebuffer = gl.createFramebuffer.bind(gl);
  const bindFramebuffer = gl.bindFramebuffer.bind(gl);
  const createTexture = gl.createTexture.bind(gl);
  const bindTexture = gl.bindTexture.bind(gl);
  const texParameteri = gl.texParameteri.bind(gl);
  const texSubImage3D = gl.texSubImage3D.bind(gl);
  const getUniformLocation = gl.getUniformLocation.bind(gl);
  const useProgram = gl.useProgram.bind(gl);
  const uniform1i = gl.uniform1i.bind(gl);
  const getAttribLocation = gl.getAttribLocation.bind(gl);
  const activeTexture = gl.activeTexture.bind(gl);
  const texImage3D = gl.texImage3D.bind(gl);
  const viewport = gl.viewport.bind(gl);

  const TEXTURE_2D = gl.TEXTURE_2D;
  const TEXTURE_2D_ARRAY = gl.TEXTURE_2D_ARRAY;
  const TEXTURE_MAG_FILTER = gl.TEXTURE_MAG_FILTER;
  const TEXTURE_MIN_FILTER = gl.TEXTURE_MIN_FILTER;
  const FLOAT = gl.FLOAT;
  const FRAMEBUFFER = gl.FRAMEBUFFER;
  const UNSIGNED_BYTE = gl.UNSIGNED_BYTE;
  const RGBA = gl.RGBA;
  const NEAREST = gl.NEAREST;
  const CLAMP_TO_EDGE = gl.CLAMP_TO_EDGE;
  const ARRAY_BUFFER = gl.ARRAY_BUFFER;
  const TRIANGLE_STRIP = gl.TRIANGLE_STRIP;

  // small GL helpers (inner so they can capture `gl`)
  const _compileShader = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    //if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
    return sh;
  };

  const _createProgram = (vs: string, fs: string) => {
    const p = gl.createProgram()!;
    attachShader(p, _compileShader(gl.VERTEX_SHADER, vs));
    attachShader(p, _compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    //const progLog = gl.getProgramInfoLog(p);
    //if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(progLog || undefined);
    return p;
  };

  const _instAttrib = (loc: number, size: number, offset: number) => {
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, FLOAT, false, BYTES_PER_INSTANCE, offset);
    gl.vertexAttribDivisor(loc, 1);
  };

  const _createRenderTarget = (w: number, h: number): RenderTarget => {
    const fb = createFramebuffer(); bindFramebuffer(FRAMEBUFFER, fb);
    const tex = createTexture(); bindTexture(TEXTURE_2D, tex);
    gl.texImage2D(TEXTURE_2D, 0, RGBA, w, h, 0, RGBA, UNSIGNED_BYTE, null);
    texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
    texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST);
    gl.framebufferTexture2D(FRAMEBUFFER, gl.COLOR_ATTACHMENT0, TEXTURE_2D, tex, 0);
    return { fb, tex, width: w, height: h };
  };

  // instance state
  const spriteProgram = _createProgram(spriteVS_src, spriteFS_src);
  useProgram(spriteProgram);
  uniform1i(getUniformLocation(spriteProgram, "uTexArray"), 0);

  const instanceBuffer = createBuffer();
  bindBuffer(ARRAY_BUFFER, instanceBuffer);

  const locTransform = getAttribLocation(spriteProgram, "aTransform");
  _instAttrib(locTransform, 3, 0);
  _instAttrib(locTransform + 1, 3, 12);
  _instAttrib(locTransform + 2, 3, 24);

  const locLayer = getAttribLocation(spriteProgram, "aLayer");
  _instAttrib(locLayer, 1, 36);

  const postPrograms: WebGLProgram[] = [_createProgram(fsQuadVs, postNoopFs)];

  let targetA: RenderTarget | null = _createRenderTarget(canvas.width, canvas.height);
  let targetB: RenderTarget | null = _createRenderTarget(canvas.width, canvas.height);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const loadTextureArray = () => {
    const images = [...AssetLibrary._textureCache.values()];
    if (!images.length) return null;

    // TODO: Replace with global sprite size
    const size = assetLibrary._dimensions;
    const layers = images.length;

    const tex = createTexture();
    activeTexture(gl.TEXTURE0);
    bindTexture(TEXTURE_2D_ARRAY, tex);
    texParameteri(TEXTURE_2D_ARRAY, TEXTURE_MIN_FILTER, NEAREST);
    texParameteri(TEXTURE_2D_ARRAY, TEXTURE_MAG_FILTER, NEAREST);
    texParameteri(TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, CLAMP_TO_EDGE);
    texParameteri(TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, CLAMP_TO_EDGE);
    texImage3D(TEXTURE_2D_ARRAY, 0, RGBA, size, size, layers, 0, RGBA, UNSIGNED_BYTE, null);

    for (let i = 0; i < layers; i++) {
      texSubImage3D(TEXTURE_2D_ARRAY, 0, 0, 0, i, size, size, 1, RGBA, UNSIGNED_BYTE, images[i]);
    }

    return { tex, width: size, height: size, layers };
  };

  const runPostChain = (srcTex: WebGLTexture | null, width: number, height: number) => {
    let readTex = srcTex, write = targetB!;
    for (let i = 0; i < postPrograms.length; i++) {
      const prog = postPrograms[i];
      useProgram(prog);
      uniform1i(getUniformLocation(prog, "uTexture"), 0);
      activeTexture(gl.TEXTURE0);
      bindTexture(TEXTURE_2D, readTex);
      const isLast = (i === postPrograms.length - 1);
      bindFramebuffer(FRAMEBUFFER, isLast ? null : write.fb);
      viewport(0, 0, width, height);
      gl.drawArrays(TRIANGLE_STRIP, 0, 4);
      readTex = write.tex;
      write = (write === targetA) ? targetB! : targetA!;
    }
  };

  // initial texture array load (if assets ready)
  loadTextureArray();

  const _draw = (drawData: Float32Array) => {
    bindBuffer(ARRAY_BUFFER, instanceBuffer);
    bufferData(ARRAY_BUFFER, drawData, gl.DYNAMIC_DRAW);
    useProgram(spriteProgram);

    //if (!targetA) throw new Error('render targets not created');
    bindFramebuffer(FRAMEBUFFER, targetA.fb);
    viewport(0, 0, targetA.width, targetA.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const instanceCount = drawData.length / FLOATS_PER_INSTANCE;
    gl.drawArraysInstanced(TRIANGLE_STRIP, 0, 4, instanceCount);

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