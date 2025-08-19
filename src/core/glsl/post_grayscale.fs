#version 300 es
precision mediump float;
in vec2 vUV
uniform sampler2D uTexture;
out vec4 fragColor;

void main(){
  vec4 c=texture(uTexture,vUV);
  float g=dot(c.rgb,vec3(.299,.587,.114));
  fragColor=vec4(vec3(g),c.a);
}