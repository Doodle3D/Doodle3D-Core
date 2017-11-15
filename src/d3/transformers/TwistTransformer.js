import { SHAPE_TYPE_PROPERTIES } from '../../constants/shapeTypeProperties';
import * as d3Tools from '../../constants/d3Tools';
import rotateHandleURL from '../../../img/3d/rotateHandle.png';
import { createTextureFromURL, SpriteHandle } from '../../utils/threeUtils.js';
import BaseTransformer from './BaseTransformer.js';
import { getSelectedObjectsSelector, getBoundingBox } from '../../utils/selectionUtils';
import * as actions from '../../actions/index.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:transformer:twist');

const HANDLE_SCALE = 0.166;
const HANDLE_OFFSET = 15;
const handleTexture = createTextureFromURL(rotateHandleURL);

export default class TwistTransformer extends BaseTransformer {
  constructor(dispatch, scene, camera, domElement) {
    super(dispatch, scene, camera, domElement);

    this.name = 'twist-transformer';
    this.createHandle();

    this._active = false;
    this.enableHitDetection = true;
  }
  dragStart(event) {
    if (this.includesHandle(event.intersections)) {
      this.dispatch(actions.twistStart());
    } else {
      super.dragStart(event);
    }
  }
  drag(event) {
    if (this._active) {
      const delta = event.position.subtract(event.previousPosition);
      this._handle.material.rotation -= delta;

      this.dispatch(actions.twist(delta));
    } else {
      super.drag(event);
    }
  }
  dragEnd(event) {
    if (this._active) {
      this.dispatch(actions.twistEnd());
    } else {
      super.dragEnd(event);
    }
  }
  update(state) {
    this.visible = state.selection.objects.length > 0;

    // TODO: create general selector for this in a reducer
    const objectsById = state.objectsById;
    const selectedShapeDatas = getSelectedObjectsSelector(state.selection.objects, objectsById);
    const boundingBox = getBoundingBox(selectedShapeDatas, state.selection.transform);

    let editableObjects = false;
    for (const shapeData of selectedShapeDatas) {
      if (SHAPE_TYPE_PROPERTIES[shapeData.type].tools[d3Tools.TWIST]) {
        editableObjects = true;
        break;
      }
    }

    this._active = state.d3.twist.active;

    this.visible = editableObjects;
    if (!editableObjects) return;

    let { max, center } = boundingBox;
    center = center.applyMatrix(state.selection.transform);
    this._handle.position.set(center.x, max.y + HANDLE_OFFSET, center.y);
    this._handle.material.rotation = -state.d3.twist.rotation;

    this.updateSpriteScale();
  }
  createHandle() {
    this._handle = new SpriteHandle(handleTexture, HANDLE_SCALE);
    this._handle.name = 'twist-transformer-handle';
    this.add(this._handle);
  }
  includesHandle(intersections) {
    const objects = intersections.map(({ object }) => object);
    return (objects.indexOf(this._handle) !== -1);
  }
}
