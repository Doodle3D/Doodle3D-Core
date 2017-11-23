varying vec3 vNormal;
varying float vDepth;

void main() {
  vec2 normal = vNormal.xy / 2. + .5;
  float depth = mod(vDepth, 1.);

  gl_FragColor = vec4(normal, depth, 1.);
}
