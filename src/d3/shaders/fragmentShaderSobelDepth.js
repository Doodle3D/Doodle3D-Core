export default `
// edge detection based on http://williamchyr.com/tag/unity/page/2/
uniform sampler2D tDiffuse;
uniform float threshold;
uniform vec2 aspect;
varying vec2 vUv;

void main() {
  float w = (1.0 / aspect.x);
  float h = (1.0 / aspect.y);

  vec4 a = texture2D(tDiffuse, vUv);
  vec4 b = texture2D(tDiffuse, vUv + vec2(-w, -h));
  vec4 c = texture2D(tDiffuse, vUv + vec2(w, -h));
  vec4 d = texture2D(tDiffuse, vUv + vec2(-w, h));
  vec4 e = texture2D(tDiffuse, vUv + vec2(w, h));

  vec4 averageDepth = (b + c + d + e) / 4.0;
  float difference = length(averageDepth - a);

  gl_FragColor = difference > threshold ? vec4(vec3(1.0), 0.0) : vec4(0.0);
}
`;
