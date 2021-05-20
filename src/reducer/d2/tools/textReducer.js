import { Matrix, Vector } from '@doodle3d/cal';
import update from 'react-addons-update';
import * as actions from '../../../actions/index.js';
import createDebug from 'debug';
import { addObjectActive2D, setActive2D, removeObject } from '../../../reducer/objectReducers.js';
const debug = createDebug('d3d:reducer:text');

export default function textReducer(state, action) {
  if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.D2_TEXT_INIT: {
      state = removeEmptyText(state);

      const { position, textId, screenMatrixZoom } = action;
      const screenPosition = (position && screenMatrixZoom) ?
        position.applyMatrix(screenMatrixZoom.inverseMatrix()) :
        new Vector();

      if (textId) {
        return setActive2D(state, textId);
      } else {
        return addObjectActive2D(state, {
          transform: new Matrix({ x: screenPosition.x, y: screenPosition.y, sx: 0.5, sy: 0.5 }),
          type: 'TEXT',
          text: {
            text: '',
            family: state.context.font,
            weight: 'normal',
            style: 'normal'
          }
        });
      }
      return state;
    }
    case actions.D2_TEXT_INPUT_CHANGE: {
      const { text } = action;
      const { activeShape } = state.d2;
      return update(state, {
        objectsById: {
          [activeShape]: {
            text: {
              text: { $set: text }
            }
          }
        }
      });
    }
    default:
      return state;
  }
}

export function removeEmptyText(state) {
  const { activeShape } = state.d2;

  if (activeShape && state.objectsById[activeShape].text.text === '') {
    return setActive2D(removeObject(state, activeShape), null);
  }
  return state;
}
