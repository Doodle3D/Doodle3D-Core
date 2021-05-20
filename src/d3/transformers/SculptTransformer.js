import * as THREE from 'three';
import { Vector } from '@doodle3d/cal';
import { SHAPE_TYPE_PROPERTIES } from '../../constants/shapeTypeProperties.js';
import * as d3Tools from '../../constants/d3Tools';
import handleURL from '../../../img/3d/sculptHandle.png';
import { createTextureFromURL, SpriteHandle } from '../../utils/threeUtils.js';
import BaseTransformer from './BaseTransformer.js';
import { getSelectedObjectsSelector, getBoundingBox } from '../../utils/selectionUtils.js';
import * as actions from '../../actions/index.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:transformer:sculpt');

const ARROW_HELPER = false;

const HANDLE_SCALE = 0.125;
const LINE_HIT_DISTANCE = 5.0;
const lineMaterial = new THREE.LineBasicMaterial({
  depthTest: false,
  color: 0x72bcd4
});

const ARROW_HELPER_OBJECT_DIR = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 50, 0xff0000);
const ARROW_HELPER_CAMERA_DIR = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 50, 0x00ff00);
const ARROW_HELPER_SCULPT_DIR = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 50, 0x0000ff);
const ARROW_HELPER_MOUSE_DIR = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 50, 0xffff00);
ARROW_HELPER_MOUSE_DIR.visible = false;

const handleTexture = createTextureFromURL(handleURL);

export default class SculptTransformer extends BaseTransformer {
  _handles = [];
  constructor(dispatch, scene, camera, domElement) {
    super(dispatch, scene, camera, domElement);

    this.name = 'sculpt-transformer';

    this.center = new THREE.Vector2();
    this.cameraRotation = new THREE.Vector3();
    this.sideDistance = 0;

    this.enableHitDetection = true;
  }

  tap(event) {
    const handle = this.includedHandle(event.intersections);
    if (handle) {
      this.dispatch(actions.removeSculptHandle(handle.heightIndex));
      return;
    }

    const hitLine = this.findHitLine(event);
    if (hitLine) {
      // add sculpt handle, do not store as active
      this.dispatch(actions.addSculptHandle(hitLine, false));
      return;
    }

    super.tap(event);
  }

  dragStart(event) {
    const handle = this.includedHandle(event.intersections);
    if (handle) {
      this.dispatch(actions.sculptStart(handle.heightIndex, true));
      return;
    }

    const hitLine = this.findHitLine(event);
    if (hitLine) {
      // add sculpt handle, store as active
      this.dispatch(actions.addSculptHandle(hitLine, true));
      return;
    }

    super.dragStart(event);
  }

  drag(event) {
    if (this.sculpt && this.sculpt.activeHandle !== null) {
      const { normalMatrix, origin, sculptDirection } = this.calculateSculptDirection();

      const mouseDelta = event.position.subtract(event.previousPosition);
      const mouseDirection = new THREE.Vector3()
        .set(mouseDelta.x, -mouseDelta.y, 0)
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(this._camera.object.matrix))
        .applyMatrix3(normalMatrix)
        .normalize();

      ARROW_HELPER_MOUSE_DIR.position.copy(origin);
      ARROW_HELPER_MOUSE_DIR.setDirection(mouseDirection);

      const delta = mouseDirection.dot(sculptDirection) * mouseDelta.length();

      this.dispatch(actions.sculpt(delta));
    } else {
      super.drag(event);
    }
  }

  dragEnd(event) {
    if (this.sculpt && this.sculpt.activeHandle !== null) {
      ARROW_HELPER_MOUSE_DIR.visible = false;
      this.dispatch(actions.sculptEnd());
      return;
    }
    super.dragEnd(event);
  }

  update(state) {
    this.sculpt = state.d3.sculpt;

    this.visible = state.selection.objects.length > 0;

    // TODO: create general selector for this in a reducer
    const objectsById = state.objectsById;
    const selectedShapeDatas = getSelectedObjectsSelector(state.selection.objects, objectsById);
    const boundingBox = getBoundingBox(selectedShapeDatas, state.selection.transform);

    const editableObjects = selectedShapeDatas.some(shapeData => {
      return SHAPE_TYPE_PROPERTIES[shapeData.type].tools[d3Tools.SCULPT];
    });

    this.visible = editableObjects;
    if (!editableObjects) return;

    let { min, max, center } = boundingBox;
    center = center.applyMatrix(state.selection.transform);
    const maxSize = new Vector(max.x, max.z).applyMatrix(state.selection.transform);
    this.sideDistance = maxSize.subtract(center).length();
    this.center.copy(center);
    this.maxHeight = max.y;
    this.minHeight = min.y;

    if (!this._state || state.d3.camera !== this._state.d3.camera) this._camera = state.d3.camera;

    this.createUI(this.sculpt.handles.length);
    this.updateHandlePosition();

    this.updateSpriteScale();

    this._state = state;
  }
  removeHandles() {
    const children = [...this.children];
    for (let i = 0; i < children.length; i ++) {
      const mesh = children[i];
      if (mesh.geometry) mesh.geometry.dispose();
      this.remove(mesh);
    }
  }
  createUI(numItems) {
    if (this.numItems === numItems) return;
    this.removeHandles();

    if (ARROW_HELPER) {
      this.add(
        ARROW_HELPER_OBJECT_DIR,
        ARROW_HELPER_SCULPT_DIR,
        ARROW_HELPER_CAMERA_DIR,
        ARROW_HELPER_MOUSE_DIR
      );
    }

    this._handles = [];
    const lineGeometry = new THREE.Geometry();
    for (let heightIndex = 0; heightIndex < numItems; heightIndex ++) {
      const handle = this.createHandle(heightIndex);
      this.add(handle);
      this._handles.push(handle);
      lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    }
    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.add(this.line);
    this.numItems = numItems;
  }
  createHandle(index) {
    const handle = new SpriteHandle(handleTexture, HANDLE_SCALE);
    handle.name = `sculpt-transformer-handle-${index}`;
    handle.heightIndex = index;
    return handle;
  }
  calculateSculptDirection() {
    const inverseWorld = new THREE.Matrix4().getInverse(this.matrixWorld);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(inverseWorld);

    const origin = new THREE.Vector3(this.center.x, this.minHeight, this.center.y);

    const objectDirection = new THREE.Vector3(0, 1, 0).applyMatrix3(normalMatrix);

    const cameraDirection = new THREE.Vector3()
      .set(0, 0, -1)
      .applyEuler(this._camera.object.rotation)
      .applyMatrix3(normalMatrix);

    const sculptDirection = new THREE.Vector3()
      .crossVectors(cameraDirection, objectDirection)
      .setY(0)
      .normalize();

    return { origin, objectDirection, cameraDirection, sculptDirection, normalMatrix };
  }
  updateHandlePosition() {
    const { origin, objectDirection, cameraDirection, sculptDirection } = this.calculateSculptDirection();

    ARROW_HELPER_OBJECT_DIR.position.copy(origin);
    ARROW_HELPER_OBJECT_DIR.setDirection(objectDirection);
    ARROW_HELPER_CAMERA_DIR.position.copy(origin);
    ARROW_HELPER_CAMERA_DIR.setDirection(cameraDirection);
    ARROW_HELPER_SCULPT_DIR.position.copy(origin);
    ARROW_HELPER_SCULPT_DIR.setDirection(sculptDirection);

    for (let i = 0; i < this.sculpt.handles.length; i ++) {
      const handle = this._handles[i];

      const { scale, pos: y } = this.sculpt.handles[i];

      const base = new THREE.Vector2(sculptDirection.x, sculptDirection.z)
        .multiplyScalar(this.sideDistance * scale)
        .add(this.center);

      const position = new THREE.Vector3(base.x, y, base.y);
      handle.position.copy(position);

      this.line.geometry.vertices[i].copy(position);
    }
    if (this.line) {
      this.line.geometry.verticesNeedUpdate = true;
    }
  }
  // checks for handles in objects and returns the first found
  includedHandle(intersections) {
    if (this._handles.length === 0) return null;
    for (const i in intersections) {
      const object = intersections[i].object;
      const handleIndex = this._handles.indexOf(object);
      if (handleIndex !== -1) {
        return this._handles[handleIndex];
      }
    }
    return null;
  }

  // Check if event was close enough to line,
  // if it was returns y position
  // otherwise returns null
  findHitLine(event) {
    if (!this.line) return null;

    const { ray } = this.getRayCaster(event.position);

    for (let i = 1; i < this.line.geometry.vertices.length; i ++) {
      const v0 = this.line.geometry.vertices[i - 1];
      const v1 = this.line.geometry.vertices[i];

      const pointOnSegment = new THREE.Vector3();
      const distance = Math.sqrt(ray.distanceSqToSegment(v0, v1, pointOnSegment, null));

      if (distance < LINE_HIT_DISTANCE) {
        return pointOnSegment.y;
      }
    }
    return null;
  }
}
