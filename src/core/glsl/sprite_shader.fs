#version 300 es

precision mediump float;
in vec2 vUV;
flat in int vLayer;
uniform highp sampler2DArray uTexArray;
out vec4 fragColor;

void main(){
  fragColor=texture(uTexArray, vec3(vUV, float(vLayer)));
}