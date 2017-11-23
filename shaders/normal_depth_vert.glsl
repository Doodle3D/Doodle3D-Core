varying vec3 vNormal;
varying float vDepth;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vDepth = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).z / 30.;

  #include <begin_vertex>
  #include <project_vertex>
}
