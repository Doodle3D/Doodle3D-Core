import update from 'react-addons-update';
import * as actions from '../../../../actions/index.js';
import { addObjectActive2D, addObject, setActive2D } from '../../../objectReducers.js';
import { Matrix, Vector } from '@doodle3d/cal';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:rect');

const DEFAULT_WIDTH = 25;
const DEFAULT_HEIGHT = 25;

export default function rectReducer(state, action) {
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
        type: 'RECT',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y })
      });

    case actions.D2_DRAG:
      const beginPos = new Vector().copy(state.objectsById[activeShape].transform);
      const delta = scenePosition.subtract(beginPos);

      const width = delta.x;
      const height = delta.y;
      return updateRect(state, activeShape, width, height);

    case actions.D2_DRAG_END:
      return setActive2D(state, null);

    case actions.D2_TAP:
      return addObject(state, {
        type: 'RECT',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        rectSize: {
          x: DEFAULT_WIDTH,
          y: DEFAULT_HEIGHT
        }
      });

    default:
      return state;
  }
}

function updateRect(state, id, width, height) {
  return update(state, {
    objectsById: {
      [id]: {
        rectSize: {
          x: { $set: width },
          y: { $set: height }
        }
      }
    }
  });
}
