uniform float opacity;
uniform sampler2D tMatcap;
uniform vec3 color;
varying vec2 vNormal;

vec4 screen(vec4 b, vec4 s) {
  return b + s - (b * s);
}

vec4 multiply(vec4 b, vec4 s) {
  return b * s;
}

// source https://www.w3.org/TR/compositing-1/#blendingdarken
vec4 hardLight(vec4 b, vec4 s) {
  if (length(s) < .5) {
    return multiply(b, 2. * s);
  } else {
    return screen(b, 2. * s - 1.);
  }
}

void main() {
  vec4 matcap = texture2D(tMatcap, vNormal);
  vec4 coloredMatcap = hardLight(matcap, vec4(color, 1.));
  gl_FragColor = vec4(coloredMatcap.rgb, opacity);
}
