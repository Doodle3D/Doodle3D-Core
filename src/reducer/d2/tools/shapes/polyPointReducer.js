import update from 'react-addons-update';
import * as actions from '../../../../actions/index.js';
import { addObjectActive2D, addObject, setActive2D } from '../../../objectReducers.js';
import { Matrix, Vector } from '@doodle3d/cal';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:star');

const DEFAULT_RADIUS = 25;

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
        type: 'POLY_POINTS',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        polyPoints: {
          numPoints: 6,
          radius: 0
        }
      });

    case actions.D2_DRAG:
      if (activeShape) {
        const beginPos = new Vector().copy(state.objectsById[activeShape].transform);
        const delta = scenePosition.subtract(beginPos);

        const numPoints = Math.min(15, Math.max(3, Math.round(delta.y / 10) + 6));
        const radius = Math.abs(delta.x);
        return update(state, {
          objectsById: {
            [activeShape]: {
              polyPoints: {
                numPoints: { $set: numPoints },
                radius: { $set: radius }
              }
            }
          }
        });
      }
      return state;

    case actions.D2_DRAG_END:
      if (activeShape) {
        state = setActive2D(state, null);
      }
      return state;

    case actions.D2_TAP:
      return addObject(state, {
        type: 'POLY_POINTS',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        polyPoints: {
          numPoints: 6,
          radius: DEFAULT_RADIUS
        }
      });

    default:
      return state;
  }
}
