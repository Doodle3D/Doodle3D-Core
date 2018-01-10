import { CANVAS_SIZE } from '../../constants/d2Constants';
import * as THREE from 'three';
import BaseTransformer from './BaseTransformer.js';
import * as actions from '../../actions/index.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:transformer:sculpt');

const CANVAS_WIDTH = CANVAS_SIZE;
const CANVAS_HEIGHT = CANVAS_SIZE;

export default class SculptTransformer extends BaseTransformer {
  constructor(dispatch, scene, camera, domElement) {
    super(dispatch, scene, camera, domElement);

    this.name = 'stamp-transformer';
    this.enableHitDetection = true;

    const geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(-CANVAS_WIDTH, 0, -CANVAS_HEIGHT),
      new THREE.Vector3(CANVAS_WIDTH, 0, -CANVAS_HEIGHT),
      new THREE.Vector3(CANVAS_WIDTH, 0, CANVAS_HEIGHT),
      new THREE.Vector3(-CANVAS_WIDTH, 0, CANVAS_HEIGHT),
      new THREE.Vector3(-CANVAS_WIDTH, 0, -CANVAS_HEIGHT)
    );
    geometry.computeLineDistances();
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0x000000,
      dashSize: 10,
      gapSize: 10,
      linewidth: 1
    });
    this.dottedLine = new THREE.Line(geometry, lineMaterial);
    this.add(this.dottedLine);

    this.hasSelection = false;
  }

  update(state) {
    this.hasSelection = state.selection.objects.length > 0;
  }

  tap(event) {
    const intersection = event.intersections.find(({ object }) => object.isShapeMesh);
    if (this.hasSelection && intersection) {
      this.dispatch(actions.stamp(intersection));
    } else {
      super.tap(event);
    }
  }
}
