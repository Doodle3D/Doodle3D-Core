import update from 'react-addons-update';
import { Matrix } from '@doodle3d/cal';
import ClipperShape from '@doodle3d/clipper-js';
import { recursiveClone } from './clone.js';
import { addObject, removeObject } from '../reducer/objectReducers.js';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import { shapeToPoints } from '../shape/shapeToPoints.js';
import { applyMatrixOnShape, pathToVectorPath } from './vectorUtils.js';
import { findEndPointIndexesOfPaths, mergePaths } from '../reducer/pointsReducers.js';
import R from 'ramda';
// import createDebug from 'debug';
// const debug = createDebug('d3d:util:substractShapeFromState');

function getShapePaths(shapeData, matrix) {
  matrix = shapeData.transform.multiplyMatrix(matrix);
  const shapes = shapeToPoints(shapeData)
    .reduce((a, { points, holes }) => a.concat([points, ...holes]), []);
  // collect all paths (transform to Scene Space)
  return applyMatrixOnShape(shapes, matrix);
}

// Does the last point of the outline equal the last point?
// TODO move to pointsReducer
function isClosed(paths) {
  const outline = paths[0];
  const firstPoint = outline[0];
  const lastPoint = outline[outline.length - 1];
  return firstPoint.equals(lastPoint);
}

export default function subtractShapeFromState(state, differenceShape, tool, options = {}) {
  const { matrix = new Matrix(), skipCompoundPath = false, scale, skip } = options;
  const objectsToAdd = [];

  if (scale !== undefined) differenceShape.scaleUp(scale);

  for (const id of [...state.spaces[state.activeSpace].objectIds]) {
    const shapeData = state.objectsById[id];

    if (skip && skip.includes(id)) continue;

    // if shape doens't interact with tool go to next shape
    if (!SHAPE_TYPE_PROPERTIES[shapeData.type].tools[tool]) continue;

    const paths = getShapePaths(shapeData, matrix);

    if (skipCompoundPath && shapeData.fill) continue;

    let shape = new ClipperShape(paths, shapeData.fill, true, false, false);
    if (scale !== undefined) shape = shape.scaleUp(scale);
    shape = shape.round().removeDuplicates();

    // shape touched differenceShape ?
    // TODO optimize: can we find a cheaper check?
    const hasCollsion = shape.intersect(differenceShape).paths.length > 0;

    if (!hasCollsion) continue;

    const resultShape = shape.difference(differenceShape);

    // Nothing left?
    if (resultShape.paths.length === 0) {
      state = removeObject(state, shapeData.UID);
      continue;
    }
    // Seperate shapes, group hole shapes with their outline (shape they're a hole in).
    // Returns two dimentional array, with per shape an array of paths.
    // The first item of each path is the outline, the others are holes, if there are any.
    let resultShapes = resultShape
      .separateShapes()
      .map(resultPaths => { // go through all created shapes (1 shape can be a combination of outline+holes)
        if (scale !== undefined) resultPaths.scaleDown(scale);
        resultPaths = resultPaths
          .removeDuplicates()
          .mapToLower()
          .filter(path => path.length > 1)
          .map(pathToVectorPath);

        // Clipper never adds a line from the last point to first point,
        // so we add these lines for all paths of this shape manually.
        // But only when this was a filled shape.
        if (shapeData.fill) {
          resultPaths.forEach(path => path.push(path[0].clone()));
        }

        return resultPaths;
      })
      .filter(resultPaths => resultPaths.length > 0);

    if (resultShapes.length === 0) {
      state = removeObject(state, shapeData.UID);
      continue;
    }

    if (!shapeData.fill && isClosed(paths)) {
      resultShapes = mergeShapes(resultShapes);
    }

    // go through all (merged) shapes
    for (let i = 0; i < resultShapes.length; i ++) {
      const [points, ...holes] = resultShapes[i];

      // try updating shape with first path.
      // only possible if compount path or free hand shape
      if (i === 0 && ['COMPOUND_PATH', 'FREE_HAND', 'POLYGON'].includes(shapeData.type)) {
        state = update(state, {
          objectsById: {
            [shapeData.UID]: {
              points: { $set: points },
              holes: { $set: holes },
              transform: { $set: matrix.inverseMatrix() }
            }
          }
        });
      } else {
        // if first shape but not a compount path or free hand shape,
        // we can't update so we have to remove
        if (i === 0) {
          state = removeObject(state, shapeData.UID);
        }

        objectsToAdd.push({
          ...recursiveClone(shapeData),
          type: shapeData.fill ? 'COMPOUND_PATH' : 'FREE_HAND',
          transform: matrix.inverseMatrix(),
          points,
          holes
        });
      }
    }
  }

  for (let i = 0; i < objectsToAdd.length; i ++) {
    const object = objectsToAdd[i];
    state = addObject(state, object);
  }

  return state;
}

const getOutline = R.head();

function mergeShapes(shapes) {
  // debug('mergeShapes');
  // get outlines from shapes
  const paths = R.map(getOutline, shapes);
  // debug('    paths: ', toString(paths));
  const match = findEndPointIndexesOfPaths(paths);
  // debug('    match: ', toString(match));
  if (match) {
    const [pathAIndex, pathBIndex, matchingIndexes] = match;
    const mergedPath = mergePaths(paths[pathAIndex], paths[pathBIndex], matchingIndexes); // merge path
    // debug('    mergedPath: ', toString(mergedPath));
    const mergedShape = [mergedPath]; // turn path into shape
    // update shapes
    const newShapes = R.pipe(
      R.update(pathAIndex, mergedShape), // update one shape with merged shape
      R.remove(pathBIndex, 1) // remove other path
    )(shapes);
    // if merge was found we start over
    return mergeShapes(newShapes);
  } else { // no merge, just return same shapes
    return shapes;
  }
}
