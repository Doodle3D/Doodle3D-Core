import { Vector, Matrix, Image } from '@doodle3d/cal';
import { SELECTION_VIEW_MIN_AXIS_SCALE, SELECTION_VIEW_MIN_SCALE } from '../../constants/d2Constants';
import dottedLineUrl from '../../../img/2d/dotLine01.png';
import rotateHandleUrl from '../../../img/2d/rotateHandle.png';
import corner01Url from '../../../img/2d/corner01.png';
import corner02Url from '../../../img/2d/corner02.png';
import corner03Url from '../../../img/2d/corner03.png';
import corner04Url from '../../../img/2d/corner04.png';
import { PIXEL_RATIO } from '../../constants/general';
import { getSelectedObjectsSelector, getBoundingBox } from '../../utils/selectionUtils';
import * as actions from '../../actions/index.js';
import BaseTool from './BaseTool.js';
import * as humanReadable from '../../utils/humanReadable.js';
import { dimensionsText } from '../texts.js';
import { isNegative } from '../../utils/matrixUtils';
// import createDebug from 'debug';
// const debug = createDebug('d3d:2d:selection');

const dottedLine = new Image(dottedLineUrl, 0, 14).load(() => URL.revokeObjectURL(dottedLineUrl));
const rotateHandle = new Image(rotateHandleUrl, 27, 30).load(() => URL.revokeObjectURL(rotateHandleUrl));
const cornerImages = [
  new Image(corner01Url, 35, 35).load(() => URL.revokeObjectURL(corner01Url)),
  new Image(corner02Url, 35, 35).load(() => URL.revokeObjectURL(corner02Url)),
  new Image(corner03Url, 35, 35).load(() => URL.revokeObjectURL(corner03Url)),
  new Image(corner04Url, 35, 35).load(() => URL.revokeObjectURL(corner04Url))
];

export default class TransformTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer) {
    super(dispatch, sceneSpaceContainer);

    this.active = true;
    this.visible = true;

    this.transform = new Matrix();
    this.position = new Vector();

    this.enableHitDetection = true;
  }

  _findHit(position) {
    if (this.numObjects === 0) return 'dragselect';

    const thresholdDistance = 20.0 * PIXEL_RATIO;
    const pixelRatioNormalizer = new Matrix();
    pixelRatioNormalizer.scale = 1 / PIXEL_RATIO;
    const screenMatrixZoom = this.parent.getScreenMatrix().multiplyMatrix(pixelRatioNormalizer);

    const {
      rotatePos, corners, cornerNames, sides, sideNames, points
    } = getHandlePositions(this.boundingBox, this.transform, screenMatrixZoom);

    if (rotatePos.distanceTo(position) < thresholdDistance) return 'rotate';

    for (let i = 0; i < corners.length; i ++) {
      const point = corners[i];
      if (point.distanceTo(position) < thresholdDistance) return cornerNames[i];
    }

    for (let i = 0; i < sides.length; i ++) {
      const point = sides[i];
      if (point.distanceTo(position) < thresholdDistance) return sideNames[i];
    }

    // if point is inside bounding box => translate
    if (pointInsideConvexPolygon(points, position)) return 'translate';

    // if position is outside any select handle => dragselect
    return 'dragselect';
  }

  dragStart(event) {
    const { position, intersections } = event;
    let handle = this._findHit(position, intersections);

    if (!handle) {
      super.dragStart(event);
      return;
    }

    if (handle === 'dragselect') {
      const [uid] = intersections;
      if (uid !== undefined) {
        this.dispatch(actions.deselectAll());
        this.dispatch(actions.select(uid));
        handle = 'translate';
      }
    }

    this._dispatch(actions.transformStart, handle, position);

    this.position.copy(position);
  }

  drag(event) {
    if (!this._active) {
      super.drag(event);
      return;
    }

    const { position } = event;
    const delta = position.subtract(this.position);
    this.position.copy(position);

    this._dispatch(actions.transform, delta, position);
  }

  dragEnd(event) {
    if (!this._active) {
      super.dragEnd(event);
      return;
    }

    this._dispatch(actions.transformEnd);
  }

  multitouchStart(event) {
    if (this.numObjects === 0) {
      super.multitouchStart(event);
      return;
    }

    const screenMatrixZoom = this.parent.getScreenMatrix();
    const { points } = getHandlePositions(this.boundingBox, this.transform, screenMatrixZoom);
    if (!event.positions.some(position => pointInsideConvexPolygon(points, position))) {
      super.multitouchStart(event);
      return;
    }

    this._dispatch(actions.multitouchTransformStart);
  }

  multitouch(event) {
    if (!this._active) {
      super.multitouch(event);
      return;
    }

    const { positions, previousPositions } = event;
    this._dispatch(actions.multitouchTransform, positions, previousPositions);
  }

  multitouchEnd(event) {
    if (!this._active) {
      super.dragEnd(event);
      return;
    }

    this._dispatch(actions.multitouchTransformEnd);
  }

  tap(event) {
    const { intersections } = event;
    if (intersections.length === 0) {
      this.dispatch(actions.deselectAll());
    } else {
      const [id] = intersections;
      this.dispatch(actions.toggleSelect(id));
    }

    super.tap(event);
  }

  update(state) {
    super.update(state);

    let needRender = false;
    if (state === this._state) return needRender;

    this._active = state.d2.transform.active;

    const { selection, objectsById, d2: transform } = state;

    if (!this._state || selection !== this._state.selection) {
      const selectedShapeDatas = getSelectedObjectsSelector(selection.objects, objectsById);
      const boundingBox = getBoundingBox(selectedShapeDatas, selection.transform);

      this.numObjects = selection.objects.length;
      this.transform = selection.transform;
      this.boundingBox = boundingBox;

      needRender = true;
    }

    if (!this._state || transform !== this._state.d2.transform) needRender = true;

    this._state = state;
    return needRender;
  }

  draw(context, matrix) {
    if (this.numObjects !== 0) {
      context.globalAlpha = 1.0;
      const scale = 0.5 * PIXEL_RATIO;

      const {
        rotatePos, corners, sides, points, width, height, widthPosition, heightPosition
      } = getHandlePositions(this.boundingBox, this.transform, matrix);
      const { rotation } = this.transform;

      const rotateAngle = isNegative(this.transform) ? Math.PI + rotation : rotation;
      rotateHandle.drawAngleScale(context, 0, rotatePos.x, rotatePos.y, rotateAngle, scale, scale);

      for (let i = 0; i < points.length; i ++) {
        const pointA = points[i];
        const pointB = points[(i + 1) % points.length];

        const angle = pointB.subtract(pointA).angle();

        const sx = pointA.distanceTo(pointB) * 2 / PIXEL_RATIO;
        const sy = dottedLine.height;

        dottedLine.drawCropAngleScale(context, 0, pointA.x, pointA.y, sx, sy, angle, scale, scale);
      }

      for (let i = 0; i < corners.length; i ++) {
        const image = cornerImages[i];
        const point = corners[i];

        image.drawAngleScale(context, 0, point.x, point.y, rotation, scale, scale);
      }

      for (let i = 0; i < sides.length; i ++) {
        const image = cornerImages[i];
        const point = sides[i];

        image.drawAngleScale(context, 0, point.x, point.y, rotation, scale, scale);
      }

      const textWidth = humanReadable.distance(width);
      dimensionsText.drawText(context, textWidth, widthPosition.x, widthPosition.y);
      const textHeight = humanReadable.distance(height);
      dimensionsText.drawText(context, textHeight, heightPosition.x, heightPosition.y);
    }

    if (this._state && this._state.d2.transform.handle === 'dragselect') {
      let { start, end } = this._state.d2.transform.dragSelect;
      start = start.scale(PIXEL_RATIO);
      end = end.scale(PIXEL_RATIO);

      const width = end.x - start.x;
      const height = end.y - start.y;

      context.strokeStyle = '#72bcd4';
      context.lineWidth = 1.0 * PIXEL_RATIO;
      context.strokeRect(start.x, start.y, width, height);
    }
  }
}

const CORNERS = ['lefttop', 'leftbottom', 'rightbottom', 'righttop'];
const SIDES = ['left', 'bottom', 'right', 'top'];

function getHandlePositions(boundingBox, transform, screenMatrixZoom) {
  const matrix = transform.multiplyMatrix(screenMatrixZoom);
  const { min, max } = boundingBox;

  const points = [
    new Vector(min.x, min.z),
    new Vector(min.x, max.z),
    new Vector(max.x, max.z),
    new Vector(max.x, min.z)
  ].map(point => point.applyMatrix(matrix));
  if (isNegative(transform)) points.reverse();

  const distanceVertical = points[0].distanceTo(points[1]);
  const distanceHorizontal = points[1].distanceTo(points[2]);

  const minAxisScale = PIXEL_RATIO * SELECTION_VIEW_MIN_AXIS_SCALE;
  const minViewScale = PIXEL_RATIO * SELECTION_VIEW_MIN_SCALE;

  const drawScaleY = distanceVertical > minAxisScale;
  const drawScaleX = distanceHorizontal > minAxisScale;
  const drawMinScale = distanceVertical < minViewScale && distanceHorizontal < minViewScale;

  const corners = [];
  const cornerNames = [];
  for (let i = 0; i < points.length; i ++) {
    if (drawMinScale && i !== 2) continue;

    const point = points[i];
    corners.push(point);

    const cornerIndex = isNegative(transform) ? (3 - i) : i;
    cornerNames.push(`scale-${CORNERS[cornerIndex]}`);
  }

  const sides = [];
  const sideNames = [];
  for (let i = 0; i < points.length; i ++) {
    const pointA = points[i];

    const isHorizontal = (i + 1) % 2 === 0;
    const isVertical = i % 2 === 0;
    if (!(drawScaleX && isHorizontal) && !(drawScaleY && isVertical)) continue;

    const pointB = points[(i + 1) % points.length];
    sides.push(pointA.add(pointB).scale(0.5));

    const cornerIndex = isNegative(transform) ? (6 - i) % 4 : i;
    sideNames.push(`scale-${SIDES[cornerIndex]}`);
  }

  const center = points[0].add(points[3]).scale(0.5);
  const normal = points[3].subtract(points[0]).normal().normalize();

  const rotatePos = center.add(normal.scale(30 * PIXEL_RATIO));

  const width = (max.x - min.x) * Math.abs(transform.sx);
  const height = (max.z - min.z) * Math.abs(transform.sy);

  const widthPosition = calculateCenterLineOffset(points[1], points[2], -25, -20);
  const heightPosition = calculateCenterLineOffset(points[2], points[3], -25, -20);

  return {
    rotatePos, corners, cornerNames, sides, sideNames, points, width, height, widthPosition, heightPosition
  };
}

function calculateCenterLineOffset(a, b, minOffset, additionalOffset) {
  const normal = b.subtract(a).normal().normalize();
  const offset = minOffset + Math.abs(normal.dot(new Vector(1, 0))) * additionalOffset;
  return a.add(b).scale(0.5).add(normal.scale(offset));
}

function pointInsideConvexPolygon(boundingBoxPoints, point) {
  for (let i = 1; i <= boundingBoxPoints.length; i ++) {
    const pointA = boundingBoxPoints[i - 1];
    const pointB = boundingBoxPoints[i % boundingBoxPoints.length];

    const normal = pointB.subtract(pointA).normal().normalize();

    if (point.subtract(pointA).dot(normal) < 0) return false;
  }

  return true;
}
