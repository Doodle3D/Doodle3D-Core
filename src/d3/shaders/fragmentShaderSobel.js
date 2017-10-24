export default `
uniform sampler2D tDiffuse;
uniform float threshold;
uniform vec2 aspect;
varying vec2 vUv;

void main() {
  float w = (1.0 / aspect.x);
  float h = (1.0 / aspect.y);

  vec4 n[9];
  n[0] = texture2D(tDiffuse, vUv + vec2( -w, -h));
  n[1] = texture2D(tDiffuse, vUv + vec2(0.0, -h));
  n[2] = texture2D(tDiffuse, vUv + vec2(  w, -h));
  n[3] = texture2D(tDiffuse, vUv + vec2( -w, 0.0));
  n[4] = texture2D(tDiffuse, vUv);
  n[5] = texture2D(tDiffuse, vUv + vec2(  w, 0.0));
  n[6] = texture2D(tDiffuse, vUv + vec2( -w, h));
  n[7] = texture2D(tDiffuse, vUv + vec2(0.0, h));
  n[8] = texture2D(tDiffuse, vUv + vec2(  w, h));

  vec4 sobel_horizEdge = n[2] + (2.0 * n[5]) + n[8] - (n[0] + (2.0 * n[3]) + n[6]);
  vec4 sobel_vertEdge  = n[0] + (2.0 * n[1]) + n[2] - (n[6] + (2.0 * n[7]) + n[8]);
  vec3 sobel = sqrt((sobel_horizEdge.rgb * sobel_horizEdge.rgb) + (sobel_vertEdge.rgb * sobel_vertEdge.rgb));

  gl_FragColor = (length(sobel) > threshold) ? vec4(vec3(1.0), 0.0) : vec4(0.0);
}
`;
