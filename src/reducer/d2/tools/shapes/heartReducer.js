import update from 'react-addons-update';
import * as actions from '../../../../actions/index.js';
import { addObjectActive2D, addObject, setActive2D } from '../../../objectReducers.js';
import { Matrix, Vector } from '@doodle3d/cal';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:star');

const DEFAULT_WIDTH = 30.0;
const DEFAULT_HEIGHT = 30.0;

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
        type: 'HEART',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        heart: {
          width: 1.0,
          height: 1.0
        }
      });

    case actions.D2_DRAG:
      if (activeShape) {
        const beginPos = new Vector().copy(state.objectsById[activeShape].transform);
        const delta = scenePosition.subtract(beginPos);

        const width = Math.abs(delta.x);
        const height = Math.abs(delta.y);

        return update(state, {
          objectsById: {
            [activeShape]: {
              heart: {
                width: { $set: width },
                height: { $set: height }
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
        type: 'HEART',
        transform: new Matrix({ x: scenePosition.x, y: scenePosition.y }),
        heart: {
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT
        }
      });

    default:
      return state;
  }
}
