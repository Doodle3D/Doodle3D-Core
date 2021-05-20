import update from 'react-addons-update';
import fillPath from 'fill-path';
import ClipperShape from '@doodle3d/clipper-js';
import * as actions from '../../../actions/index.js';
import { SHAPE_TYPE_PROPERTIES } from '../../../constants/shapeTypeProperties.js';
import { LINE_WIDTH, CLIPPER_PRECISION } from '../../../constants/d2Constants.js';
import { shapeToPoints } from '../../../shape/shapeToPoints.js';
import { applyMatrixOnShape, pathToVectorPath } from '../../../utils/vectorUtils.js';
import { addObject } from '../../../reducer/objectReducers.js';
import subtractShapeFromState from '../../../utils/subtractShapeFromState.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:bucket');

const MITER_LIMIT = 30.0;

export default function bucketReducer(state, action) {
  if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.D2_TAP:
      const color = state.context.color;

      // if clicked on a filled shape change shape color
      const filledPathIndex = action.objects.findIndex(id => (
        state.objectsById[id].fill &&
        SHAPE_TYPE_PROPERTIES[state.objectsById[id].type].tools[state.d2.tool]
      ));
      if (filledPathIndex !== -1) {
        const id = action.objects[filledPathIndex];
        return update(state, {
          objectsById: { [id]: { color: { $set: color } } }
        });
      }

      // otherwise fill paths
      const {
        screenMatrixContainer,
        screenMatrixZoom
      } = action;

      // convert mouse position to container space
      // discard screen matrix zoom and apply screen matrix container
      const matrix = screenMatrixZoom.inverseMatrix().multiplyMatrix(screenMatrixContainer);
      const position = action.position.applyMatrix(matrix);

      const paths = getPaths(state, screenMatrixContainer);

      const result = fillPath(paths, position, {
        lineWidth: LINE_WIDTH,
        miterLimit: MITER_LIMIT,
        fillOffset: 'outside'
      });
      // TODO
      // reduce number of points of result, sometimes result has 900+ points

      if (result.length === 0) return state;

      const fillPaths = result
        .map(pathToVectorPath)
        .map(path => {
          path.push(path[0].clone());
          return path;
        });

      const fillShape = new ClipperShape(fillPaths, true, true, true)
        .offset(LINE_WIDTH / 2.0, {
          joinType: 'jtMiter',
          endType: 'etClosedPolygon',
          miterLimit: MITER_LIMIT
        });

      state = subtractShapeFromState(state, fillShape, state.d2.tool, {
        matrix: screenMatrixContainer,
        skipCompoundPath: true,
        scale: CLIPPER_PRECISION
      });

      return addCompoundPathToState(state, fillPaths, screenMatrixContainer.inverseMatrix(), color);
    default:
      return state;
  }
}

function getPaths(state, screenMatrixContainer) {
  const paths = [];

  for (const id of state.spaces[state.activeSpace].objectIds) {
    const shapeData = state.objectsById[id];

    if (!SHAPE_TYPE_PROPERTIES[shapeData.type].tools[state.d2.tool]) continue;

    const shapes = shapeToPoints(shapeData);
    for (let i = 0; i < shapes.length; i ++) {
      const { points, holes } = shapes[i];
      const matrix = shapeData.transform.multiplyMatrix(screenMatrixContainer);
      const shape = applyMatrixOnShape([points, ...holes], matrix);

      paths.push(...shape);
    }
  }
  return paths;
}

function addCompoundPathToState(state, paths, transform, color) {
  const [points, ...holes] = paths;
  return addObject(state, {
    type: 'COMPOUND_PATH',
    transform,
    points,
    holes,
    color
  });
}
