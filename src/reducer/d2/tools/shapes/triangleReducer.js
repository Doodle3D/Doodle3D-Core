import update from 'react-addons-update';
import * as actions from '../../../../actions/index.js';
import { addObjectActive2D, addObject, setActive2D } from '../../../objectReducers.js';
import { Matrix, Vector } from '@doodle3d/cal';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:triangle');

const DEFAULT_WIDTH = 25;
const DEFAULT_HEIGHT = 25;

export default function triangleReducer(state, action) {
  if (action.log !== false) debug(action.type);
  const { position, screenMatrixZoom } = action;
  let scenePosition;
  if (position !== undefined && screenMatrixZoom !== undefined) {
    scenePosition = position.applyMatrix(screenMatrixZoom.inverseMatrix());
  }
  const activeShape = state.d2.activeShape;

  switch (action.type) {
    case actions.D2_DRAG_START:
      return addObjectActive2D(state, {
        type: 'TRIANGLE',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y })
      });

    case actions.D2_DRAG:
      if (activeShape) {
        const beginPos = new Vector().copy(state.objectsById[activeShape].transform);
        const delta = scenePosition.subtract(beginPos);

        const width = delta.x * 2;
        const height = delta.y;
        state = updateTriangle(state, activeShape, width, height);
      }
      return state;

    case actions.D2_DRAG_END:
      if (activeShape) {
        state = setActive2D(state, null);
      }
      return state;

    case actions.D2_TAP:
      return addObject(state, {
        type: 'TRIANGLE',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        triangleSize: {
          x: DEFAULT_WIDTH,
          y: DEFAULT_HEIGHT
        }
      });

    default:
      return state;
  }
}

function updateTriangle(state, id, width, height) {
  return update(state, {
    objectsById: {
      [id]: {
        triangleSize: {
          x: { $set: width },
          y: { $set: height }
        }
      }
    }
  });
}
