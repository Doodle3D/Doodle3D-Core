export default `
uniform float mNear;
uniform float mFar;
uniform float opacity;
uniform float logDepthBufFC;
varying float vFragDepth;

#include <common>

void main() {
  float fragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;
  float depth = fragDepthEXT / gl_FragCoord.w;
  float color = 1.0 - smoothstep( mNear, mFar, depth );
  gl_FragColor = vec4( vec3( color ), opacity );
}
`;
