#version 300 es

const vec2 POS[4]=vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));
out vec2 vUV;

void main(){
  vec2 p = POS[gl_VertexID];
  vUV=(p+1.)*.5;
  gl_Position=vec4(p,0,1);
}