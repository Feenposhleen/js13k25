import spriteVS_src from './glsl/sprite_shader.vs';
import spriteFS_src from './glsl/sprite_shader.fs';
import fsQuadVs from './glsl/full_screen_quad.vs';
import postBlurFs from './glsl/post_blur.fs';
import postNoopFs from './glsl/post_noop.fs';

import { utils } from './utils';
import { Sprite } from './sprite';
import assetLibrary from './asset_library';
import { BYTES_PER_INSTANCE, RENDERER_HEIGHT, RENDERER_SPRITE_RESOLUTION, RENDERER_WIDTH } from './config';

export type RenderTarget = { _fb: WebGLFramebuffer | null; _tex: WebGLTexture | null; _width: number; _height: number };

type RenderDataItem = { _mat: Float32Array; _layer: number; _opacity: number };

const _walkBuffer: Array<RenderDataItem> = [];
const _walkView: Array<RenderDataItem> = [];
const texHalf = 400 / 2;
const texScale = new Float32Array([texHalf, 0, 0, 0, texHalf, 0, 0, 0, 1]);
const pxToClip = new Float32Array([2 / RENDERER_WIDTH, 0, 0, 0, -2 / RENDERER_HEIGHT, 0, -1, 1, 1]);

const _fillWalkView = (sprite: Sprite, parentMat: Float32Array | null, parentOpacity = 1): void => {
  const x = sprite._position[0]!;
  const y = sprite._position[1]!;
  const angle = sprite._angle || 0;

  const sx = sprite._scale[0];
  const sy = sprite._scale[1];

  // Reusable matrices
  if (!sprite.___r) {
    sprite.___r = [
      new Float32Array(9),
      new Float32Array(9),
      new Float32Array(9),
    ]
  }

  let local = utils._mat3FromTRS(x * RENDERER_WIDTH, y * RENDERER_HEIGHT, angle, sx, sy, sprite.___r[0]);
  const world = parentMat ? utils._mat3Multiply(sprite.___r[1], parentMat, local) : local;
  const worldWithTex = utils._mat3Multiply(sprite.___r[2], sprite.___r[1], texScale);

  const combinedOpacity = parentOpacity * sprite._opacity;

  if (sprite._texture !== null) {
    const obj = _walkBuffer[_walkView.length] || {};
    _walkBuffer[_walkView.length] = obj;

    obj._mat = utils._mat3Multiply(obj._mat || new Float32Array(9), pxToClip, worldWithTex);
    obj._layer = assetLibrary._textureIndex(sprite._texture);
    obj._opacity = combinedOpacity;
    _walkView.push(obj);
  }

  if (sprite._children) for (const c of sprite._children) {
    _fillWalkView(c, world, combinedOpacity);
  }
};

export const _buildRenderData = (sprites: Sprite[], outRenderBuffer: Float32Array): number => {
  _walkView.length = 0;
  for (const s of sprites) _fillWalkView(s, null);

  let i = 0;
  for (const s of _walkView) {
    outRenderBuffer[i++] = s._mat[0]; outRenderBuffer[i++] = s._mat[1]; outRenderBuffer[i++] = s._mat[2];
    outRenderBuffer[i++] = s._mat[3]; outRenderBuffer[i++] = s._mat[4]; outRenderBuffer[i++] = s._mat[5];
    outRenderBuffer[i++] = s._mat[6]; outRenderBuffer[i++] = s._mat[7]; outRenderBuffer[i++] = s._mat[8];
    outRenderBuffer[i++] = s._layer | 0;
    outRenderBuffer[i++] = s._opacity;
  }

  return _walkView.length;
};

export const createRenderer = (canvas: HTMLCanvasElement) => {
  canvas.width = RENDERER_WIDTH;
  canvas.height = RENDERER_HEIGHT;

  // request a non-premultiplied canvas so blending is predictable
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true }) as WebGL2RenderingContext;

  // WebGL props for minification
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
    return { _fb: fb, _tex: tex, _width: w, _height: h };
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

  const locOpacity = getAttribLocation(spriteProgram, "aOpacity");
  _instAttrib(locOpacity, 1, 40);

  const postPrograms: WebGLProgram[] = [_createProgram(fsQuadVs, postBlurFs), _createProgram(fsQuadVs, postNoopFs)];

  let targetA: RenderTarget | null = _createRenderTarget(canvas.width, canvas.height);
  let targetB: RenderTarget | null = _createRenderTarget(canvas.width, canvas.height);

  gl.enable(gl.BLEND);
  // use standard alpha blending for straight (non-premultiplied) alpha
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const _reloadTextures = () => {
    const images = [...assetLibrary._textureCache.values()];
    if (!images.length) return null;

    const tex = createTexture();
    activeTexture(gl.TEXTURE0);
    bindTexture(TEXTURE_2D_ARRAY, tex);

    // make sure uploaded image data is treated as straight (non-premultiplied) alpha
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    texParameteri(TEXTURE_2D_ARRAY, TEXTURE_MIN_FILTER, NEAREST);
    texParameteri(TEXTURE_2D_ARRAY, TEXTURE_MAG_FILTER, NEAREST);
    texParameteri(TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, CLAMP_TO_EDGE);
    texParameteri(TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, CLAMP_TO_EDGE);
    texImage3D(TEXTURE_2D_ARRAY, 0, RGBA, RENDERER_SPRITE_RESOLUTION, RENDERER_SPRITE_RESOLUTION, images.length, 0, RGBA, UNSIGNED_BYTE, null);

    for (let i = 0; i < images.length; i++) {
      texSubImage3D(TEXTURE_2D_ARRAY, 0, 0, 0, i, RENDERER_SPRITE_RESOLUTION, RENDERER_SPRITE_RESOLUTION, 1, RGBA, UNSIGNED_BYTE, images[i]);
    }

    return { tex, width: RENDERER_SPRITE_RESOLUTION, height: RENDERER_SPRITE_RESOLUTION, layers: images.length };
  };

  const runPostChain = (srcTex: WebGLTexture | null, width: number, height: number) => {
    let readTex = srcTex, write = targetB!;
    for (let i = 0; i < postPrograms.length; i++) {
      const prog = postPrograms[i];
      useProgram(prog);
      uniform1i(getUniformLocation(prog, "uTexture"), 0);
      gl.uniform1f(getUniformLocation(prog, "t"), performance.now() / 1000);
      activeTexture(gl.TEXTURE0);
      bindTexture(TEXTURE_2D, readTex);
      gl.generateMipmap(TEXTURE_2D);
      texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      const isLast = (i === postPrograms.length - 1);
      bindFramebuffer(FRAMEBUFFER, isLast ? null : write._fb);
      viewport(0, 0, width, height);
      gl.drawArrays(TRIANGLE_STRIP, 0, 4);
      readTex = write._tex;
      write = (write === targetA) ? targetB! : targetA!;
    }
  };

  const _draw = (drawData: Float32Array, spriteCount: number) => {
    bindBuffer(ARRAY_BUFFER, instanceBuffer);
    bufferData(ARRAY_BUFFER, drawData, gl.DYNAMIC_DRAW);
    useProgram(spriteProgram);

    //if (!targetA) throw new Error('render targets not created');
    bindFramebuffer(FRAMEBUFFER, targetA._fb);
    viewport(0, 0, targetA._width, targetA._height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArraysInstanced(TRIANGLE_STRIP, 0, 4, spriteCount);

    runPostChain(targetA._tex, targetA._width, targetA._height);
  };

  // initial texture array load (if assets ready)
  _reloadTextures();

  return {
    _draw,
    _reloadTextures,
    _buildRenderData,
  };
};

export type Renderer = ReturnType<typeof createRenderer>;

export default createRenderer;