import update from 'react-addons-update';
import * as actions from '../../../../actions/index.js';
import { addObjectActive2D, addObject, setActive2D } from '../../../objectReducers.js';
import { Matrix, Vector } from '@doodle3d/cal';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:star');

const DEFAULT_INNER_RADIUS = 10;
const DEFAULT_OUTER_RADIUS = 25;

export default function starReducer(state, action) {
  // if (action.log !== false) debug(action.type);
  const { position, screenMatrixZoom } = action;
  let scenePosition;
  if (position !== undefined && screenMatrixZoom !== undefined) {
    scenePosition = position.applyMatrix(screenMatrixZoom.inverseMatrix());
  }
  const activeShape = state.d2.activeShape;

  switch (action.type) {
    case actions.D2_DRAG_START:
      return addObjectActive2D(state, {
        type: 'STAR',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        star: {
          rays: 5,
          innerRadius: 0,
          outerRadius: 0
        }
      });

    case actions.D2_DRAG:
      if (activeShape) {
        const beginPos = new Vector().copy(state.objectsById[activeShape].transform);
        const delta = scenePosition.subtract(beginPos);

        const innerRadius = Math.abs(delta.y);
        const outerRadius = Math.abs(delta.x);
        state = updateStar(state, activeShape, innerRadius, outerRadius);
      }
      return state;

    case actions.D2_DRAG_END:
      if (activeShape) {
        state = setActive2D(state, null);
      }
      return state;

    case actions.D2_TAP:
      return addObject(state, {
        type: 'STAR',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        star: {
          rays: 5,
          innerRadius: DEFAULT_INNER_RADIUS,
          outerRadius: DEFAULT_OUTER_RADIUS
        }
      });

    default:
      return state;
  }
}
function updateStar(state, id, innerRadius, outerRadius) {
  return update(state, {
    objectsById: {
      [id]: {
        star: {
          innerRadius: { $set: innerRadius },
          outerRadius: { $set: outerRadius }
        }
      }
    }
  });
}
