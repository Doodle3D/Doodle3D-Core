import update from 'react-addons-update';
import * as actions from '../../../../actions/index.js';
import { removeObject, addObjectActive2D, setActive2D } from '../../../objectReducers.js';
import { Vector, Matrix } from '@doodle3d/cal';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:skewRect');

export default function skewRectReducer(state, action) {
  if (action.log !== false) debug(action.type);
  const mouse = action.mouse;
  const activeShape = state.d2.activeShape;

  switch (action.type) {

    case actions.D2_MOUSE_DOWN:
      return addObjectActive2D(state, {
        type: 'SKEW_RECT',
        transform: new Matrix({ x: mouse.position.x, y: mouse.position.y }),
        points: [
          new Vector(100, 0),
          new Vector(-100, 0),
          new Vector(-100, 0),
          new Vector(100, 0)
        ]
      });

    case actions.D2_MOUSE_MOVE:
      if (action.mouse.down && activeShape) {
        const delta = mouse.position.subtract(mouse.start);

        state = update(state, {
          objectsById: {
            [activeShape]: {
              points: {
                [2]: { $set: new Vector(delta.x - 100, delta.y) },
                [3]: { $set: new Vector(delta.x + 100, delta.y) }
              }
            }
          }
        });
      }
      return state;

    case actions.D2_MOUSE_UP:
      if (activeShape) {
        state = setActive2D(state, null);
      }
      return state;

    case actions.D2_MOUSE_CLICK:
      if (activeShape) {
        state = removeObject(state, activeShape);
        state = setActive2D(state, null);
      }
      return state;

    default:
      return state;
  }
}
