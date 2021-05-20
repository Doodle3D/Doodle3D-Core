import * as THREE from 'three';
import { Vector } from '@doodle3d/cal';
// import createDebug from 'debug';
// const debug = createDebug('d3d:preview:selectionBox');

export default class SelectionBox extends THREE.Object3D {
  matrixAutoUpdate = false;

  constructor() {
    super();

    const material = new THREE.MeshBasicMaterial();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const matrix = new THREE.Matrix4();
    matrix.setPosition(new THREE.Vector3(0.5, 0.5, 0.5));
    geometry.applyMatrix(matrix);

    const mesh = new THREE.Mesh(geometry, material);

    this._box = new THREE.BoxHelper(mesh, 0x72bcd4);
    this._box.name = 'bounding-box';

    this.add(this._box);
  }
  updateBoundingBox(boundingBox) {
    if (this._boundingBox === boundingBox) {
      return;
    }
    this._boundingBox = boundingBox;

    this.update();
  }

  updateTransform(transform) {
    if (this._transform === transform) {
      return;
    }

    this._transform = transform;

    this.update();
  }

  update() {
    if (!this.visible || this._transform === undefined || this._boundingBox === undefined) {
      return;
    }

    let min = new Vector(this._boundingBox.min.x, this._boundingBox.min.z);
    min = min.applyMatrix(this._transform);

    this._box.rotation.y = -this._transform.rotation;
    this._box.position.x = min.x;
    this._box.position.z = min.y;
    this._box.scale.x = (this._boundingBox.max.x - this._boundingBox.min.x) * this._transform.sx;
    this._box.scale.z = (this._boundingBox.max.z - this._boundingBox.min.z) * this._transform.sy;

    this._box.scale.y = this._boundingBox.max.y - this._boundingBox.min.y;
    this._box.position.y = this._boundingBox.min.y;

    this._box.updateMatrix();
  }
}
