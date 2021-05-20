import { Vector } from '@doodle3d/cal';
import * as THREE from 'three';
import heightHandleURL from '../../../img/3d/heightHandle.png';
import pivitHandleURL from '../../../img/3d/sculptHandle.png';
import * as d3Tools from '../../constants/d3Tools';
import { SHAPE_TYPE_PROPERTIES } from '../../constants/shapeTypeProperties';
import { createTextureFromURL, SpriteHandle, CanvasPlane } from '../../utils/threeUtils.js';
import BaseTransformer from './BaseTransformer.js';
import { getSelectedObjectsSelector, getBoundingBox } from '../../utils/selectionUtils';
import * as actions from '../../actions/index.js';
import { dimensionsText } from '../../d2/texts.js';
import * as humanReadable from '../../utils/humanReadable.js';

// import createDebug from 'debug';
// const debug = createDebug('d3d:transformer:height');

const HEIGHT_HANDLE_OFFSET = 15;
const HEIGHT_HANDLE_SCALE = 0.166;

const heightHandleTexture = createTextureFromURL(heightHandleURL);
const pivitHandleTexture = createTextureFromURL(pivitHandleURL);

const HEIGHT_LABEL_HEIGHT = 128;
const HEIGHT_LABEL_WIDTH = 32;
const HEIGHT_LABEL_FONT = dimensionsText.clone();
HEIGHT_LABEL_FONT.size = 30;

export default class HeightTransformer extends BaseTransformer {
  constructor(dispatch, scene, camera, domElement) {
    super(dispatch, scene, camera, domElement);

    this.name = 'height-transformer';
    this.enableHitDetection = true;

    this._active = false;
  }

  dragStart(event) {
    const handle = this.includesHandle(event.intersections);
    if (handle) {
      this.dispatch(actions.changeHeightStart(handle));
    } else {
      super.dragStart(event);
    }
  }

  drag(event) {
    if (this._active) {
      const delta = event.position.subtract(event.previousPosition);
      this.dispatch(actions.changeHeight(delta));
    } else {
      super.drag(event);
    }
  }

  dragEnd(event) {
    if (this._active) {
      this.dispatch(actions.changeHeightEnd());
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
      if (SHAPE_TYPE_PROPERTIES[shapeData.type].tools[d3Tools.HEIGHT]) {
        editableObjects = true;
        break;
      }
    }

    this._active = state.d3.height.active;

    this.visible = editableObjects;

    if (!this.visible) return;
    if (!this._handleTop) {
      this.createHandle();
    }
    let { max, min, center } = boundingBox;

    center = center.applyMatrix(state.selection.transform);

    this._handleTop.position.set(center.x, max.y + HEIGHT_HANDLE_OFFSET, center.y);
    this._handleBottom.position.set(center.x, min.y - HEIGHT_HANDLE_OFFSET, center.y);
    this._handleTranslate.position.set(center.x, (min.y + max.y) / 2, center.y);

    if (this._active !== this._heightLabel.visible) {
      if (!this._heightLabel.visible) {
        const inverseWorld = new THREE.Matrix4().getInverse(this.matrixWorld);
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(inverseWorld);

        const objectDirection = new THREE.Vector3(0, 1, 0).applyMatrix3(normalMatrix);

        const cameraDirection = new THREE.Vector3()
          .set(0, 0, -1)
          .applyEuler(state.d3.camera.object.rotation)
          .applyMatrix3(normalMatrix);

        const sculptDirection = new THREE.Vector3()
          .crossVectors(cameraDirection, objectDirection)
          .setY(0)
          .normalize();

        const maxSize = new Vector(max.x, max.z).applyMatrix(state.selection.transform);
        const sideDistance = maxSize.subtract(center).length();

        const base = new THREE.Vector2(sculptDirection.x, sculptDirection.z)
          .multiplyScalar(sideDistance)
          .add(center);

        const position = new THREE.Vector3(base.x, 0, base.y);
        this._heightLabel.position.copy(position);
        this._heightLabel.rotation.y = -new THREE.Vector2(sculptDirection.x, sculptDirection.z).angle();
      }

      this._heightLabel.visible = this._active;
    }

    if (this._active) {
      this._heightLabel.position.y = (min.y + max.y) / 2;

      this._heightLabel.draw((context, width, height) => {
        context.clearRect(0, 0, width, height);

        // context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // context.fillRect(0, 0, width, height);

        context.save();
        context.translate(5, Math.round(height / 2));
        context.rotate(Math.PI * 0.5);
        HEIGHT_LABEL_FONT.drawText(context, humanReadable.distance(max.y - min.y), 0, 0);
        context.restore();
      });

      const scale = this._heightLabel.position.distanceTo(this.camera.getWorldPosition()) / 1000.0;
      this._heightLabel.scale.set(scale, scale, scale);
    }

    this.updateSpriteScale();
  }
  createHandle() {
    this._handleTop = new SpriteHandle(heightHandleTexture, HEIGHT_HANDLE_SCALE);
    this._handleTop.name = 'height-transformer-handle-top';
    this.add(this._handleTop);

    this._handleBottom = new SpriteHandle(heightHandleTexture, HEIGHT_HANDLE_SCALE);
    this._handleBottom.name = 'height-transformer-handle-bottom';
    this.add(this._handleBottom);

    this._handleTranslate = new SpriteHandle(pivitHandleTexture, HEIGHT_HANDLE_SCALE);
    this._handleTranslate.name = 'height-transformer-handle-translate';
    this.add(this._handleTranslate);

    this._heightLabel = new CanvasPlane(HEIGHT_LABEL_WIDTH, HEIGHT_LABEL_HEIGHT);
    this._heightLabel.visible = false;
    this.add(this._heightLabel);
  }
  includesHandle(intersections) {
    if (!this._handleTop) return '';
    const objects = intersections.map(({ object }) => object);

    if (objects.indexOf(this._handleTop) !== -1) return 'top';
    if (objects.indexOf(this._handleBottom) !== -1) return 'bottom';
    if (objects.indexOf(this._handleTranslate) !== -1) return 'translate';
    return '';
  }
}
