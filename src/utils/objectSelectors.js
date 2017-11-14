import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import { calculatePointInImage } from './matrixUtils.js';
import R from 'ramda';
// import createDebug from 'debug';
// const debug = createDebug('d3d:utils:objectSelectors');

// returns true if object is a closed shape
export function closedShapesFilter({ points }) {
  return points[0].equals(points[points.length - 1]);
}
// returns true if object is a open (not closed) shape
export function openShapesFilter(object) {
  return !closedShapesFilter(object);
}
// returns true if object should snap
export function snappingFilter({ type }) {
  return SHAPE_TYPE_PROPERTIES[type].snapping;
}

export function getObjectsById(state) {
  return state.sketcher.present.objectsById;
}

export function contains(state, testFn) {
  const objects = R.values(getObjectsById(state));
  const index = R.findIndex(testFn, objects);
  return (index !== -1);
}

export function containsType(state, type) {
  return contains(state, R.propEq('type', type));
}

export function getSnappingPoints(state, matrix) {
  return Object.values(state.objectsById)
    .filter(snappingFilter) // filter closed shapes
    .filter(openShapesFilter)
    .map(shapeData => {
      const transform = matrix ? shapeData.transform.multiplyMatrix(matrix) : shapeData.transform;
      const startPoint = shapeData.points[0].applyMatrix(transform);
      const endPoint = shapeData.points[shapeData.points.length - 1].applyMatrix(transform);

      return { shapeData, startPoint, endPoint };
    });
}
export function getObjectsFromIds(state, ids) {
  return ids.map(id => state.objectsById[id]);
}
export function filterType(objects, type) {
  return objects.filter(value => value.type === type);
}
export function getFirst(objects) {
  return objects.length > 0 ? objects[0] : null;
}
export function getColor(shapeData, position, screenMatrixZoom) {
  if (!shapeData) return null;

  const canvas = shapeData.imageData;
  const context = canvas.getContext('2d');

  const start = calculatePointInImage(position, shapeData, screenMatrixZoom);

  const [r, g, b] = context.getImageData(start.x, start.y, 1, 1).data;
  const color = (r << 16) + (g << 8) + b;

  return color;
}
