import update from 'react-addons-update';
import { Matrix, Vector } from '@doodle3d/cal';
import * as actions from '../../../../actions/index.js';
import { addObjectActive2D, addObject, setActive2D } from '../../../objectReducers.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:circle');

const DEFAULT_RADIUS = 25;
const DEFAULT_SEGMENT = Math.PI * 0.5; // for segmented circle
const MAX_SEGMENT = Math.PI * 2;

export default function circleReducer(state, action, segmented = false) {
  if (action.log !== false) debug(action.type);
  const { position, screenMatrixZoom } = action;
  let scenePosition;
  if (position !== undefined && screenMatrixZoom !== undefined) {
    scenePosition = position.applyMatrix(screenMatrixZoom.inverseMatrix());
  }
  const activeShape = state.d2.activeShape;
  switch (action.type) {
    case actions.D2_DRAG_START: {
      return addObjectActive2D(state, {
        type: (segmented ? 'CIRCLE_SEGMENT' : 'CIRCLE'),
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y })
      });
    }
    case actions.D2_DRAG: {
      if (activeShape) {
        const beginPos = new Vector().copy(state.objectsById[activeShape].transform);
        const delta = scenePosition.subtract(beginPos);
        let segment;
        if (segmented) {
          segment = (delta.angle() + Math.PI * 2.5) % MAX_SEGMENT;
        } else {
          segment = MAX_SEGMENT;
        }
        const radius = delta.length();
        state = updateCircle(state, activeShape, radius, segment);
      }
      return state;
    }
    case actions.D2_DRAG_END: {
      if (activeShape) {
        state = setActive2D(state, null);
      }
      return state;
    }
    case actions.D2_TAP: {
      const segment = segmented ? DEFAULT_SEGMENT : MAX_SEGMENT;

      return addObject(state, {
        type: (segmented ? 'CIRCLE_SEGMENT' : 'CIRCLE'),
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        circle: {
          radius: DEFAULT_RADIUS,
          segment
        }
      });
    }
    default:
      return state;
  }
}
function updateCircle(state, id, radius, segment) {
  return update(state, {
    objectsById: {
      [id]: {
        circle: {
          radius: { $set: radius },
          segment: { $set: segment }
        }
      }
    }
  });
}
