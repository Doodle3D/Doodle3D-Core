import * as THREE from 'three';

export default class Camera extends THREE.PerspectiveCamera {
  matrixAutoUpdate = false;

  update({ object }) {
    this.matrix.copy(object.matrix);
  }
}
