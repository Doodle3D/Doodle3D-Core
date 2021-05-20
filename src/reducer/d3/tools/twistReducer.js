import update from 'react-addons-update';
import { Utils } from '@doodle3d/cal';
import * as actions from '../../../actions/index.js';
import * as d3Tools from '../../../constants/d3Tools';
import { SHAPE_TYPE_PROPERTIES } from '../../../constants/shapeTypeProperties.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:twist');

const CHANGE_FACTOR = 0.002;
const maxTwist = 1;

export default function twistReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  switch (action.category) {
    case actions.CAT_SELECTION:
      return initTwist(state);

    default:
      break;
  }

  switch (action.type) {
    case actions.D3_CHANGE_TOOL:
      return initTwist(state);

    case actions.TWIST_START:
    case actions.TWIST_END:
      state = update(state, {
        d3: {
          twist: {
            active: { $set: action.type === actions.TWIST_START }
          }
        }
      });
      return state;


    case actions.TWIST:
      const delta = action.delta.x * 1 * CHANGE_FACTOR;

      state = update(state, {
        d3: {
          twist: {
            rotation: { $set: state.d3.twist.rotation + delta }
          }
        }
      });

      for (const selectionData of state.selection.objects) {
        const shapeData = state.objectsById[selectionData.id];
        if (!SHAPE_TYPE_PROPERTIES[shapeData.type].tools[d3Tools.TWIST]) continue;
        const twist = Utils.MathExtended.clamb(shapeData.twist + delta, -maxTwist, maxTwist);
        // debug(UID, ': twist: ', shapeData.twist, '>', twist);

        state = update(state, {
          objectsById: {
            [shapeData.UID]: { twist: { $set: twist } }
          }
        });
      }
      return state;

    default:
      return state;
  }
}

function initTwist(state) {
  const twist = getInitialTwist(state);
  return update(state, {
    d3: {
      twist: {
        rotation: { $set: twist },
        active: { $set: false }
      }
    }
  });
}

function getInitialTwist(state) {
  const selectedObjects = state.selection.objects.map(({ id }) => state.objectsById[id]);
  let twist;
  if (selectedObjects.length === 0) {
    twist = 0;
  } else if (selectedObjects.length === 1) {
    // one shape selected: use shape's twist
    const [selectedObject] = selectedObjects;
    twist = selectedObject.twist;
  } else {
    twist = 0;
  }
  return twist;
}
