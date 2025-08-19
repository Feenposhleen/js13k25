#version 300 es
const vec2 POS[4]=vec2[4](vec2(-1.0,-1.0),vec2(1.0,-1.0),vec2(-1.0,1.0),vec2(1.0,1.0));
const vec2 UVS[4]=vec2[4](vec2(0.0,0.0),vec2(1.0,0.0),vec2(0.0,1.0),vec2(1.0,1.0));
in mat3 aTransform;   // full transform (column-major) packed by the renderer
in float aLayer;      // texture layer index
out vec2 vUV;
flat out int vLayer;
void main(){
  // transform POS (x,y,1) by the instance mat3 (already in clip-space)
  vec3 p = aTransform * vec3(POS[gl_VertexID], 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
  vUV = UVS[gl_VertexID];
  vLayer = int(aLayer + 0.2);
}