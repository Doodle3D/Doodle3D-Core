varying vec2 vNormal;

void main() {
  vNormal = normalize(normalMatrix * normal).xy / 2. + .5;

  #include <begin_vertex>
  #include <project_vertex>
}
