#version 300 es

precision mediump float;
in vec2 vUV;
flat in int vLayer;
uniform highp sampler2DArray uTexArray;
out vec4 fragColor;

void main(){
  vec4 s = texture(uTexArray, vec3(vUV, float(vLayer)));
  if (s.a < .95) discard;
  fragColor = s;
}