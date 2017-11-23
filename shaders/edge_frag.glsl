uniform sampler2D tDiffuse;
uniform vec3 color;
uniform vec2 resolution;
varying vec2 vUv;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1., 2. / 3., 1. / 3., 3.);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);
}

// convert depth to hue value so we can detect edges
vec3 depth(vec4 c) {
  return hsv2rgb(vec3(c.z, 1., 1.)) * c.w;
}

float cubicInOut(float t) {
  return t < .5 ? 4. * pow(t, 3.) : .5 * pow(2. * t - 2., 3.) + 1.;
}

void main() {
  float x = 1. / resolution.x;
  float y = 1. / resolution.y;

  // lapace filter
  vec4 f01 = texture2D(tDiffuse, vUv + vec2(0., -y));
  vec4 f10 = texture2D(tDiffuse, vUv + vec2(-x, 0.));
  vec4 f11 = texture2D(tDiffuse, vUv);
  vec4 f12 = texture2D(tDiffuse, vUv + vec2(0., y));
  vec4 f21 = texture2D(tDiffuse, vUv + vec2(x, 0.));

  float depthLaplace = length(4. * depth(f11) - depth(f01) - depth(f10) - depth(f12) - depth(f21));
  float normalLaplace = length(4. * f11.xy - f01.xy - f10.xy - f12.xy - f21.xy);

  float edge = cubicInOut(depthLaplace) + cubicInOut(normalLaplace);

  gl_FragColor = vec4(vec3(0.), edge);
}
