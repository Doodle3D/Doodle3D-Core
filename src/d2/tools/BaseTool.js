import EventGroup from '../EventGroup.js';
import * as actions from '../../actions/index.js';
import transposeEvents from '../../utils/transposeEvents.js';
import ClipperShape from '@doodle3d/clipper-js';
import { applyMatrixOnShape } from '../../utils/vectorUtils';
import { getPointsBounds } from '../../shape/shapeDataUtils';
import { shapeToPoints } from '../../shape/shapeToPoints';
import { LINE_COLLISION_MARGIN } from '../../constants/d2Constants';
import { LINE_WIDTH } from '../../constants/d2Constants';
import { PIXEL_RATIO } from '../../constants/general';
import { Matrix, Vector } from '@doodle3d/cal';

const HIT_ORDER = {
  RECT: 0,
  TRIANGLE: 0,
  STAR: 0,
  CIRCLE: 0,
  CIRCLE_SEGMENT: 0,
  BRUSH: 1,
  COMPOUND_PATH: 1,
  TEXT: 1,
  FREE_HAND: 0,
  IMAGE_GUIDE: 2,
  POLYGON: 0,
  POLY_POINTS: 0,
  HEART: 0,
  EXPORT_SHAPE: 0
};

export default class BaseTool extends EventGroup {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super();
    this.active = true;
    this.visible = true;
    this.depth = 1001;
    this.enableHitDetection = false;

    this.dispatch = dispatch;
    this.sceneSpaceContainer = sceneSpaceContainer;
    this.renderRequest = renderRequest;
  }

  dragStart({ position, preDrags, intersections }) {
    this._dispatch(actions.d2DragStart, position, preDrags, intersections);
  }
  drag({ position, previousPosition }) {
    this._dispatch(actions.d2Drag, position, previousPosition);
  }
  dragEnd({ position }) {
    this._dispatch(actions.d2DragEnd, position);
  }
  secondDragStart({ position, preDrags, intersections }) {
    this._dispatch(actions.d2SecondDragStart, position, preDrags, intersections);
  }
  secondDrag({ position, previousPosition }) {
    this._dispatch(actions.d2SecondDrag, position, previousPosition);
  }
  secondDragEnd({ position }) {
    this._dispatch(actions.d2DragEnd, position);
  }
  tap({ position, intersections }) {
    this._dispatch(actions.d2Tap, position, intersections);
  }
  wheel({ position, wheelDelta }) {
    this._dispatch(actions.d2MouseWheel, position, wheelDelta);
  }
  multitouchStart({ positions, preDrags }) {
    this._dispatch(actions.d2MultitouchStart, positions, preDrags);
  }
  multitouch({ positions, previousPositions }) {
    this._dispatch(actions.d2Multitouch, positions, previousPositions);
  }
  multitouchEnd({ positions }) {
    this._dispatch(actions.d2MultitouchEnd, positions);
  }

  onEvent(event) {
    switch (event.type) {
      case 'dragstart':
        this._previousPosition = event.position;
        break;

      case 'drag':
        event.previousPosition = this._previousPosition;
        this._previousPosition = event.position;
        break;

      case 'seconddragstart':
        this._previousSecondPosition = event.position;
        break;

      case 'seconddrag':
        event.previousPosition = this._previousSecondPosition;
        this._previousSecondPosition = event.position;
        break;

      case 'multitouchstart':
        this._previousMultitouchPositions = event.positions;
        break;

      case 'multitouch':
        event.previousPositions = this._previousMultitouchPositions;
        this._previousMultitouchPositions = event.positions;
        break;

      default:
        break;
    }

    event.intersections = [];
    if (this.enableHitDetection) {
      if (event.type === 'tap' || event.type === 'dragstart' || event.type === 'seconddragstart') {
        event.intersections = this.findHit(event.position);
      }
    }

    transposeEvents.call(this, event);
    super.onEvent(event);
  }

  findHit(position) {
    if (!this.enableHitDetection) return [];

    const pixelRatioNormalizer = new Matrix();
    pixelRatioNormalizer.scale = 1 / PIXEL_RATIO;

    const matrix = this.parent.getScreenMatrix().multiplyMatrix(pixelRatioNormalizer);

    const shapeDatas = this.space.objectIds.map(id => this.objectsById[id]);
    const margin = LINE_COLLISION_MARGIN + this.parent.parent.sx * LINE_WIDTH;

    const objects = shapeDatas
      .filter(shapeData => {
        const shapeMatrix = shapeData.transform.multiplyMatrix(matrix);
        let shapePoints = shapeToPoints(shapeData);
        let { fill } = shapeData;

        if (shapeData.type === 'TEXT') {
          if (shapeData.text.text === '') return false;
          const { min, max } = getPointsBounds(shapePoints);
          shapePoints = [{ points: [
            new Vector(min.x, min.y),
            new Vector(min.x, max.y),
            new Vector(max.x, max.y),
            new Vector(max.x, min.y)
          ], holes: [] }];
          fill = true;
        }

        const isHit = shapePoints
          .some(({ points, holes }) => {
            const shape = applyMatrixOnShape([points, ...holes], shapeMatrix);
            const clipperShape = new ClipperShape(shape, fill, true, true);

            if (fill) {
              return clipperShape
                .fixOrientation()
                .pointInShape(position, true, true);
            } else {
              return clipperShape
                .offset(margin, { joinType: 'jtSquare', endType: 'etOpenButt' })
                .separateShapes()
                .some(_clipperShape => _clipperShape.pointInShape(position, true, true));
            }
          });

        return isHit;
      })
      .sort((shapeDataA, shapeDataB) => {
        const hitOrderA = HIT_ORDER[shapeDataA.type];
        const hitOrderB = HIT_ORDER[shapeDataB.type];

        if (hitOrderA === hitOrderB) {
          const { min: minA, max: maxA } = getPointsBounds(shapeToPoints(shapeDataA), shapeDataA.transform);
          const sizeA = (maxA.x - minA.x) * (maxA.y - minA.y);
          const { min: minB, max: maxB } = getPointsBounds(shapeToPoints(shapeDataB), shapeDataB.transform);
          const sizeB = (maxB.x - minB.x) * (maxB.y - minB.y);

          return sizeA - sizeB;
        } else {
          return hitOrderA - hitOrderB;
        }
      })
      .map(({ UID }) => UID);

    return objects;
  }

  _dispatch(action, ...args) {
    // TODO could be optimized

    const pixelRatioNormalizer = new Matrix();
    pixelRatioNormalizer.scale = 1 / PIXEL_RATIO;

    const screenMatrixContainer = this.sceneSpaceContainer
      .getScreenMatrix()
      .multiplyMatrix(pixelRatioNormalizer);

    const screenMatrixZoom = this
      .getScreenMatrix()
      .multiplyMatrix(pixelRatioNormalizer);

    this.dispatch(action(...args, screenMatrixContainer, screenMatrixZoom));
  }

  update(newState) {
    // Needed for hit detection:
    this.objectsById = newState.objectsById;
    this.space = newState.spaces[newState.activeSpace];
  }
  destroy() {}
}
