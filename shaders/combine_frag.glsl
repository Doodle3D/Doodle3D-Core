varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D uTexArray[1];

void main() {
  vec4 cDiffuse = texture2D(tDiffuse, vUv);

  for (int i = 0; i < 1; i ++) {
    vec4 cTex = texture2D(uTexArray[i], vUv);
    cDiffuse = mix(cDiffuse, cTex, cTex.w);
    // cDiffuse = cTex;
  }

  gl_FragColor = cDiffuse;
}
