#version 300 es
precision mediump float;
uniform float t;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uTexture;        // with mipmaps

void main(){
  vec3 base = texture(uTexture, vUV).rgb;

  // Mip bloom
  vec3 mb =
      textureLod(uTexture, vUV, 2.0).rgb * 0.60 +
      textureLod(uTexture, vUV, 3.0).rgb * 0.30 +
      textureLod(uTexture, vUV, 4.0).rgb * 0.10;

  float tx = mod(t * 0.01, 1.0);

  // Noise
  float noise = min((mod(vUV.x - tx, 0.001) * 999.), (mod(vUV.y + tx, 0.001) * 999.));
  noise = step(0.2, noise) * 0.01;

  // Combine
  vec3 col = (base + (mb * 0.4)) - noise;

  // Tone
  col = col * vec3(1., 0.9, .85);

  // Output
  fragColor = vec4(col, 1.0);
}
