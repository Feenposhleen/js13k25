#version 300 es
precision mediump float;

in vec2 vUV;
in float t;
uniform sampler2D uTexture;
out vec4 fragColor;

void main(){
  fragColor=texture(uTexture,vUV);
}