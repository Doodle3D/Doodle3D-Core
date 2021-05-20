import { ActionCreators as undo } from 'redux-undo';
import * as notification from 'react-notification-system-redux';
import * as selectionUtils from '../utils/selectionUtils.js';
import { calculatePointInImage, decomposeMatrix } from '../utils/matrixUtils.js';
import { loadImage, prepareImage } from '../utils/imageUtils.js';
import * as traceUtils from '../utils/traceUtils.js';
import { createThrottle } from '../utils/async.js';
import { tween } from '../utils/tweenUtils.js';
import { DEFAULT_TRACE_TOLERANCE, MAX_TRACE_TOLERANCE } from '../constants/d2Constants.js';
import * as d2Tools from '../constants/d2Tools.js';
import { Matrix } from '@doodle3d/cal';
// import createDebug from 'debug';
// const debug = createDebug('d3d:actions');

export { undo };

export const ADD_OBJECT = 'ADD_OBJECT';
export const D2_DRAG_START = 'D2_DRAG_START';
export const D2_DRAG = 'D2_DRAG';
export const D2_DRAG_END = 'D2_DRAG_END';
export const D2_SECOND_DRAG_START = 'D2_SECOND_DRAG_START';
export const D2_SECOND_DRAG = 'D2_SECOND_DRAG';
export const D2_SECOND_DRAG_END = 'D2_SECOND_DRAG_END';
export const D2_TAP = 'D2_TAP';
export const D2_MOUSE_WHEEL = 'D2_MOUSE_WHEEL';
export const D2_MULTITOUCH_START = 'D2_MULTITOUCH_START';
export const D2_MULTITOUCH = 'D2_MULTITOUCH';
export const D2_MULTITOUCH_END = 'D2_MULTITOUCH_END';
export const D3_DRAG_START = 'D3_DRAG_START';
export const D3_DRAG = 'D3_DRAG';
export const D3_DRAG_END = 'D3_DRAG_END';
export const D3_SECOND_DRAG_START = 'D3_SECOND_DRAG_START';
export const D3_SECOND_DRAG = 'D3_SECOND_DRAG';
export const D3_SECOND_DRAG_END = 'D3_SECOND_DRAG_END';
export const D3_TAP = 'D3_TAP';
export const D3_MOUSE_WHEEL = 'D3_MOUSE_WHEEL';
export const D3_MULTITOUCH_START = 'D3_MULTITOUCH_START';
export const D3_MULTITOUCH = 'D3_MULTITOUCH';
export const D3_MULTITOUCH_END = 'D3_MULTITOUCH_END';
export const D2_CHANGE_TOOL = 'D2_CHANGE_TOOL';
export const D3_CHANGE_TOOL = 'D3_CHANGE_TOOL';
export const CONTEXT_CHANGE_TOOL = 'CONTEXT_CHANGE_TOOL';
export const HEIGHT_START = 'HEIGHT_START';
export const HEIGHT = 'HEIGHT';
export const HEIGHT_END = 'HEIGHT_END';
export const TWIST_START = 'TWIST_START';
export const TWIST = 'TWIST';
export const TWIST_END = 'TWIST_END';
export const SCULPT_START = 'SCULPT_START';
export const SCULPT = 'SCULPT';
export const SCULPT_END = 'SCULPT_END';
export const ADD_SCULPT_HANDLE = 'ADD_SCULPT_HANDLE';
export const REMOVE_SCULPT_HANDLE = 'REMOVE_SCULPT_HANDLE';
export const STAMP = 'STAMP';
export const BED_SELECT = 'BED_SELECT';
export const CLEAR = 'CLEAR';
export const TRANSFORM_START = 'TRANSFORM_START';
export const TRANSFORM = 'TRANSFORM';
export const TRANSFORM_END = 'TRANSFORM_END';
export const DRAG_SELECT = 'DRAG_SELECT';
export const MULTITOUCH_TRANSFORM_START = 'MULTITOUCH_TRANSFORM_START';
export const MULTITOUCH_TRANSFORM = 'MULTITOUCH_TRANSFORM';
export const MULTITOUCH_TRANSFORM_END = 'MULTITOUCH_TRANSFORM_END';
export const SELECT = 'SELECT';
export const UPDATE_MATRIX = 'UPDATE_MATRIX';
export const DESELECT = 'DESELECT';
export const TOGGLE_SELECT = 'TOGGLE_SELECT';
export const DESELECT_ALL = 'DESELECT_ALL';
export const SELECT_ALL = 'SELECT_ALL';
export const DELETE_SELECTION = 'DELETE_SELECTION';
export const DUPLICATE_SELECTION = 'DUPLICATE_SELECTION';
export const ALIGN = 'ALIGN';
export const ADD_IMAGE = 'ADD_IMAGE';
export const D2_TEXT_INIT = 'D2_TEXT_INIT';
export const D2_TEXT_INPUT_CHANGE = 'D2_TEXT_INPUT_CHANGE';
export const UNION = 'UNION';
export const INTERSECT = 'INTERSECT';
export const MOVE_SELECTION = 'MOVE_SELECTION';
export const TRACE_DRAG = 'TRACE_DRAG';
export const TRACE_DRAG_END = 'TRACE_DRAG_END';
export const TRACE_TAP = 'TRACE_TAP';
export const FLOOD_FILL = 'FLOOD_FILL';
export const TRACE_FLOOD_FILL = 'TRACE_FLOOD_FILL';
export const MENU_OPEN = 'MENU_OPEN';
export const MENU_CLOSE = 'MENU_CLOSE';
export const OPEN_SKETCH = 'OPEN_SKETCH';
export const SET_PREVENT_SCROLL = 'SET_PREVENT_SCROLL';
export const SET_DISABLE_SCROLL = 'SET_DISABLE_SCROLL';

// CATEGORIES
// actions that influence selected objects
export const CAT_SELECTION = 'SELECTION';

export function addObject(objectData) {
  return { type: 'ADD_OBJECT', objectData };
}
export function d2DragStart(position, preDrags, objects, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_DRAG_START, position, preDrags, objects, screenMatrixContainer, screenMatrixZoom };
}
export function d2Drag(position, previousPosition, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_DRAG, position, previousPosition, screenMatrixContainer, screenMatrixZoom, log: false };
}
export function d2DragEnd(position, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_DRAG_END, position, screenMatrixContainer, screenMatrixZoom };
}
export function d2SecondDragStart(position, preDrags, objects, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_SECOND_DRAG_START, position, preDrags, objects, screenMatrixContainer, screenMatrixZoom };
}
export function d2SecondDrag(position, previousPosition, screenMatrixContainer, screenMatrixZoom) {
  return {
    type: D2_SECOND_DRAG,
    log: false,
    position, previousPosition, screenMatrixContainer, screenMatrixZoom };
}
export function d2SecondDragEnd(position, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_SECOND_DRAG_END, position, screenMatrixContainer, screenMatrixZoom };
}
export function d2Tap(position, objects, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_TAP, position, objects, screenMatrixContainer, screenMatrixZoom };
}
export function d2MultitouchStart(positions, preDrags, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_MULTITOUCH_START, positions, preDrags, screenMatrixContainer, screenMatrixZoom };
}
export function d2Multitouch(positions, previousPositions, screenMatrixContainer, screenMatrixZoom) {
  return {
    log: false,
    type: D2_MULTITOUCH,
    positions, previousPositions, screenMatrixContainer, screenMatrixZoom
  };
}
export function d2MultitouchEnd(positions, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_MULTITOUCH_END, positions, screenMatrixContainer, screenMatrixZoom };
}
export function d2MouseWheel(position, wheelDelta, screenMatrixContainer, screenMatrixZoom) {
  return { type: D2_MOUSE_WHEEL, position, wheelDelta, screenMatrixContainer, screenMatrixZoom, log: false };
}
export function d3DragStart(position, preDrags, objects) {
  return { type: D3_DRAG_START, position, preDrags, objects };
}
export function d3Drag(position, previousPosition) {
  return { type: D3_DRAG, position, previousPosition, log: false };
}
export function d3DragEnd(position) {
  return { type: D3_DRAG_END, position };
}
export function d3SecondDragStart(position, preDrags, objects) {
  return { type: D3_SECOND_DRAG_START, position, preDrags, objects };
}
export function d3SecondDrag(position, previousPosition) {
  return { type: D3_SECOND_DRAG, log: false, position, previousPosition };
}
export function d3SecondDragEnd(position) {
  return { type: D3_SECOND_DRAG_END, position };
}
export function d3Tap(position, objects) {
  return { type: D3_TAP, position, objects };
}
export function d3MultitouchStart(positions, preDrags) {
  return { type: D3_MULTITOUCH_START, positions, preDrags };
}
export function d3Multitouch(positions, previousPositions) {
  return { log: false, type: D3_MULTITOUCH, positions, previousPositions };
}
export function d3MultitouchEnd(positions) {
  return { type: D3_MULTITOUCH_END, positions };
}
export function d3MouseWheel(position, wheelDelta) {
  return { type: D3_MOUSE_WHEEL, position, wheelDelta, log: false };
}
export function d2ChangeTool(tool) {
  return (dispatch, getState) => {
    dispatch({ type: D2_CHANGE_TOOL, tool });

    const state = getState();
    switch (tool) {
      case d2Tools.PHOTO_GUIDE:
        const hasImage = Object
          .values(state.sketcher.present.objectsById)
          .some(object => object.type === 'IMAGE_GUIDE');
        if (!hasImage) dispatch(importImage());
        break;

      case d2Tools.TEXT:
        const hasText = Object
          .values(state.sketcher.present.objectsById)
          .some(object => object.type === 'TEXT');
        if (!hasText) {
          dispatch(d2textInit());
        }
        break;

      default:
        break;
    }
  };
}
export function transformStart(handle, position, screenMatrixContainer, screenMatrixZoom) {
  return { type: TRANSFORM_START, handle, position, screenMatrixContainer, screenMatrixZoom };
}
export function transform(delta, position, screenMatrixContainer, screenMatrixZoom) {
  return { type: TRANSFORM, delta, position, screenMatrixContainer, screenMatrixZoom, log: false };
}
export function transformEnd(screenMatrixContainer, screenMatrixZoom) {
  return (dispatch, getState) => {
    const state = getState();

    if (state.sketcher.present.d2.transform.handle === 'dragselect') {
      dispatch({ type: DRAG_SELECT, screenMatrixContainer, screenMatrixZoom, category: CAT_SELECTION });
    }
    dispatch({ type: TRANSFORM_END, screenMatrixContainer, screenMatrixZoom });
  };
}
export function multitouchTransformStart(screenMatrixContainer, screenMatrixZoom) {
  return { type: MULTITOUCH_TRANSFORM_START, screenMatrixContainer, screenMatrixZoom };
}
export function multitouchTransform(positions, previousPositions, screenMatrixContainer, screenMatrixZoom) {
  return {
    type: MULTITOUCH_TRANSFORM, positions, previousPositions,
    screenMatrixContainer, screenMatrixZoom, log: false
  };
}
export function multitouchTransformEnd(screenMatrixContainer, screenMatrixZoom) {
  return { type: MULTITOUCH_TRANSFORM_END, screenMatrixContainer, screenMatrixZoom };
}
export function d3ChangeTool(tool) {
  return { type: D3_CHANGE_TOOL, tool };
}
export function contextChangeTool(tool) {
  return { type: CONTEXT_CHANGE_TOOL, tool };
}
export function changeHeightStart(handle) {
  return { type: HEIGHT_START, handle };
}
export function changeHeight(delta) {
  return { type: HEIGHT, delta, log: false };
}
export function changeHeightEnd() {
  return { type: HEIGHT_END };
}
export function twistStart() {
  return { type: TWIST_START };
}
export function twist(delta) {
  return { type: TWIST, delta, log: false };
}
export function twistEnd() {
  return { type: TWIST_END };
}
export function sculptStart(heightIndex) {
  return { type: SCULPT_START, heightIndex };
}
export function sculpt(delta) {
  return { type: SCULPT, delta, log: false };
}
export function sculptEnd() {
  return { type: SCULPT_END };
}
export function addSculptHandle(height, start) {
  return { type: ADD_SCULPT_HANDLE, height, start };
}
export function removeSculptHandle(heightIndex) {
  return { type: REMOVE_SCULPT_HANDLE, heightIndex };
}
export function stamp(hit) {
  return { type: STAMP, hit };
}
export function clear() {
  return { type: CLEAR };
}
export function select(shapeID) {
  return { category: CAT_SELECTION, type: SELECT, shapeID };
}
export function deselect(shapeID) {
  return { category: CAT_SELECTION, type: DESELECT, shapeID };
}
export function toggleSelect(shapeID) {
  return { category: CAT_SELECTION, type: TOGGLE_SELECT, shapeID };
}
export function deselectAll() {
  return { category: CAT_SELECTION, type: DESELECT_ALL };
}
export function selectAll() {
  return { category: CAT_SELECTION, type: SELECT_ALL };
}
export function bedSelect() {
  return { category: CAT_SELECTION, type: BED_SELECT };
}
export function deleteSelection() {
  return { type: DELETE_SELECTION };
}
export function duplicateSelection() {
  return (dispatch, getState) => {
    // store current object ids so we can determine what objects are added by duplicate selection
    const initialObjectIds = Object.keys(getState().sketcher.present.objectsById);

    dispatch({ type: DUPLICATE_SELECTION });

    const { selection, objectsById } = getState().sketcher.present;
    // calculate object ids added by duplicate selection
    const newIds = Object
      .keys(objectsById)
      .filter(id => !initialObjectIds.includes(id));

    if (newIds.length === 0) return;

    const selectedShapeDatas = selectionUtils.getSelectedObjectsSelector(selection.objects, objectsById);
    const { center } = selectionUtils.getBoundingBox(selectedShapeDatas);

    const ease = t => (Math.sin(((t + 0.5) * 2 * Math.PI) + (0.5 * Math.PI)) / 2) + 0.5;
    newIds
      .map(id => objectsById[id])
      .forEach(shapeData => {
        tween(300, t => {
          t = ease(t);

          const scale = t * 0.3 + 1.0;
          const scaleMatrix = new Matrix().scaleAroundRelative(scale, scale, center);
          const stepTransform = shapeData.transform.multiplyMatrix(scaleMatrix);

          dispatch({ type: UPDATE_MATRIX, transform: stepTransform, id: shapeData.UID, log: false });
        });
      });
  };
}
export function tweenShape(id, duration, initialTransform, targetTransform, ease) {
  return dispatch => {
    const {
      rotation: targetRotation,
      position: targetPosition,
      scale: targetScale
    } = decomposeMatrix(targetTransform);
    const {
      rotation: initialRotation,
      position: initialPosition,
      scale: initialScale
    } = decomposeMatrix(initialTransform);

    return tween(duration, t => {
      t = ease ? ease(t) : t;
      const it = 1 - t;

      const rotation = targetRotation * t + initialRotation * it;
      const position = targetPosition.scale(t).add(initialPosition.scale(it));
      const scale = targetScale.scale(t).add(initialScale.scale(it));

      dispatch({
        type: UPDATE_MATRIX,
        transform: new Matrix({
          x: position.x, y: position.y,
          sx: scale.x, sy: scale.y,
          rotation
        }),
        id,
        log: false
      });
    });
  };
}
export function union() {
  return { type: UNION };
}
export function intersect() {
  return { type: INTERSECT };
}
export function moveSelection(deltaX, deltaY) {
  return { type: MOVE_SELECTION, deltaX, deltaY };
}
export function addImage(file) {
  return (dispatch) => {
    const url = URL.createObjectURL(file);

    return dispatch({
      type: ADD_IMAGE,
      payload: loadImage(url).then(prepareImage)
    }).then(() => {
      URL.revokeObjectURL(url);
      dispatch({ type: D2_CHANGE_TOOL, tool: d2Tools.PHOTO_GUIDE });
    }).catch(error => {
      URL.revokeObjectURL(url);

      dispatch(notification.error({
        position: 'tc',
        title: 'Error loading image, please try again with another image'
      }));

      throw error; // rethrow for other listeners
    });
  };
}
export function d2textInit(position, textId, screenMatrixContainer, screenMatrixZoom) {
  return (dispatch) => {
    dispatch({ type: D2_TEXT_INIT, position, textId, screenMatrixContainer, screenMatrixZoom });
  };
}
export function d2textInputChange(text) {
  return { type: D2_TEXT_INPUT_CHANGE, text };
}

const traceDragThrottle = createThrottle();

export function traceDrag(position, start, id, screenMatrixContainer, screenMatrixZoom) {
  return (dispatch, getState) => {
    dispatch({ type: TRACE_DRAG, position, start, id, screenMatrixContainer, screenMatrixZoom });

    const state = getState();

    traceDragThrottle(() => {
      const { trace, activeShape } = state.sketcher.present.d2;
      const shapeData = state.sketcher.present.objectsById[activeShape];
      const tolerance = traceUtils.calculateTolerance(trace.start, trace.position);
      const traceStart = calculatePointInImage(trace.start, shapeData, screenMatrixZoom);

      if (tolerance > MAX_TRACE_TOLERANCE) return null;

      return dispatch(floodFill(tolerance, shapeData, traceStart)).catch(() => {
        // Ignore floodfill errors so throttle function doesn't get stuck
      });
    });
  };
}
// export function traceTap(position, objects, screenMatrixContainer, screenMatrixZoom) {
//   return async (dispatch, getState) => {
//     dispatch({ type: TRACE_TAP });
//
//     const state = getState();
//     const id = objects.find(_id => state.sketcher.present.objectsById[_id].type === 'IMAGE_GUIDE');
//
//     if (id) {
//       const shapeData = state.sketcher.present.objectsById[id];
//       const traceStart = calculatePointInImage(position, shapeData, screenMatrixZoom);
//
//       const { value: traceData } = await dispatch(floodFill(DEFAULT_TRACE_TOLERANCE, shapeData, traceStart));
//
//       return dispatch(traceFloodFill(traceData, shapeData));
//     } else {
//       return dispatch(importImage());
//     }
//   };
// }

export function importImage() {
  return dispatch => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      if (!input.files) return;
      const [file] = Array.from(input.files);
      if (!file) return;
      dispatch(addImage(file)).then(() => {
        delete window.importImageInput;
      });
    };
    input.click();
    // Fixes import from camera work, see #935
    window.importImageInput = input;
  };
}

export function traceDragEnd() {
  return (dispatch, getState) => {
    const state = getState();

    dispatch({ type: TRACE_DRAG_END });

    const id = state.sketcher.present.d2.activeShape;

    if (id) {
      const traceData = state.sketcher.present.d2.trace.floodFillData;
      const shapeData = state.sketcher.present.objectsById[id];

      return dispatch(traceFloodFill(traceData, shapeData));
    }
  };
}

export function floodFill(tolerance, shapeData, start) {
  return {
    type: FLOOD_FILL,
    payload: traceUtils.floodFill(tolerance, shapeData.imageData, start)
  };
}

export function traceFloodFill(traceData, shapeData) {
  return {
    type: TRACE_FLOOD_FILL,
    payload: traceUtils.traceFloodFill(traceData, shapeData)
  };
}

export function menuOpen(menuValue) {
  return { type: MENU_OPEN, menuValue };
}
export function menuClose(menuValue) {
  return { type: MENU_CLOSE, menuValue };
}

export function openSketch(data) {
  return { type: OPEN_SKETCH, data };
}

export function setPreventScroll(preventScroll) {
  return { type: SET_PREVENT_SCROLL, preventScroll };
}

export function setDisableScroll(disableScroll) {
  return { type: SET_DISABLE_SCROLL, disableScroll };
}
