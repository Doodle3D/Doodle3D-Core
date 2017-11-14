import { Matrix, Vector } from 'cal';
import update from 'react-addons-update';
import * as actions from '../../../actions/index.js';
import createDebug from 'debug';
import { addObjectActive2D, setActive2D, removeObject } from '../../../reducer/objectReducers.js';
const debug = createDebug('d3d:reducer:text');

export default function textReducer(state, action) {
  if (action.log !== false) debug(action.type);

  const activeShape = state.d2.activeShape;

  switch (action.type) {
    case actions.D2_TEXT_INIT: {
      const { position, textId, screenMatrixZoom } = action;
      const screenPosition = (position && screenMatrixZoom) ?
        position.applyMatrix(screenMatrixZoom.inverseMatrix()) :
        new Vector();

      if (textId) {
        return setActive2D(state, textId);
      } else {
        return addObjectActive2D(state, {
          transform: new Matrix({ x: screenPosition.x, y: screenPosition.y }),
          type: 'TEXT'
        });
      }
      return state;
    }
    case actions.D2_TEXT_INPUT_CHANGE: {
      const { text, family, style, weight, fill } = action;
      return update(state, {
        objectsById: {
          [activeShape]: {
            text: {
              text: { $set: text },
              family: { $set: family },
              style: { $set: style },
              weight: { $set: weight }
            },
            fill: { $set: fill }
          }
        }
      });
    }
    case actions.D2_TEXT_ADD: {
      if (activeShape && state.objectsById[activeShape].text.text.length === 0) {
        return setActive2D(removeObject(state, activeShape), null);
      } else {
        return setActive2D(state, null);
      }
      break;
    }
    default:
      return state;
  }
  return state;
}
