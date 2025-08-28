#version 300 es

precision mediump float;
in vec2 vUV;
in float vOpacity;
flat in int vLayer;
uniform highp sampler2DArray uTexArray;
out vec4 outColor;

void main(){
  vec4 col = texture(uTexArray, vec3(vUV, float(vLayer)));
  if (col.a < 0.8) discard;
  col.a *= vOpacity;
  outColor = col;
}