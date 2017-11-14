import update from 'react-addons-update';
import * as actions from '../../../actions/index.js';
import { addObject } from '../../../reducer/objectReducers.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:photoGuide');

export default function photoGuideReducer(state, action) {
  if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.TRACE_DRAG: {
      return update(state, {
        d2: {
          activeShape: { $set: action.id },
          trace: {
            active: { $set: true },
            start: { $set: action.start.clone() },
            position: { $set: action.position.clone() }
          }
        }
      });
    }

    case `${actions.FLOOD_FILL}_FULFILLED`: {
      return update(state, {
        d2: {
          trace: {
            floodFillData: { $set: action.payload }
          }
        }
      });
    }

    case `${actions.TRACE_FLOOD_FILL}_FULFILLED`: {
      const paths = action.payload;

      for (const points of paths) {
        state = addObject(state, {
          type: 'FREE_HAND',
          points
        });
      }

      return state;
    }

    case actions.TRACE_DRAG_END: {
      state = update(state, {
        d2: {
          activeShape: { $set: null },
          trace: {
            active: { $set: false },
            floodFillData: { $set: { edge: [], fill: [] } }
          }
        }
      });
    }

    default:
      return state;
  }
}
