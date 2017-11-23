uniform float opacity;
uniform sampler2D tMatcap;
uniform vec3 color;
varying vec2 vNormal;

// color blending from https://www.w3.org/TR/compositing-1/#blendingcolor
float lum(vec3 c) {
  return c.r * .3 + c.g * .59 + c.b * .11;
}

vec3 clipColor(vec3 c) {
  float l = lum(c);
  float n = min(min(c.r, c.g), c.b);
  float x = max(max(c.r, c.g), c.b);
  if (n < 0.) c = l + (((c - l) * l) / (l - n));
  if (x > 1.) c = l + (((c - l) * (1. - l)) / (x - l));
  return c;
}

vec3 setLum(vec3 c, float l) {
  float d = l - lum(c);
  return clipColor(c + d);
}

void main() {
  vec4 matcap = texture2D(tMatcap, vNormal);
  vec3 coloredMatcap = setLum(color, lum(matcap.rgb));
  gl_FragColor = vec4(coloredMatcap, opacity);
}
