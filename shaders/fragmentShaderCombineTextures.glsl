uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tUI;
varying vec2 vUv;

void main() {
  vec4 colorDiffuse = texture2D(tDiffuse, vUv); // cell shader
  vec4 colorNormal = texture2D(tNormal, vUv); // outline from normal texture
  colorNormal.w = 0.0;
  vec4 colorDepth = texture2D(tDepth, vUv); // outline from depth texture
  colorDepth.w = 0.0;
  vec4 colorUI = texture2D(tUI, vUv); // color ui's

  gl_FragColor = mix(max(colorDiffuse - colorDepth - colorNormal, 0.0), colorUI, colorUI.w);
}
