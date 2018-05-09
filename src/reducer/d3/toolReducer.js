import * as actions from '../../actions/index.js';
import * as tools from '../../constants/d3Tools.js';
import heightReducer from './tools/heightReducer.js';
import twistReducer from './tools/twistReducer.js';
import sculptReducer from './tools/sculptReducer.js';
import stampReducer from './tools/stampReducer.js';
import { cameraReducer } from './tools/cameraReducer.js';
import update from 'react-addons-update';

import createDebug from 'debug';
const debug = createDebug('d3d:reducer:d3:tool');

const reducers = {
  [tools.HEIGHT]: heightReducer,
  [tools.TWIST]: twistReducer,
  [tools.SCULPT]: sculptReducer,
  [tools.STAMP]: stampReducer
};

export default function toolReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  state = cameraReducer(state, action);

  if (action.type === actions.D3_CHANGE_TOOL && action.tool !== state.d3.tool) {
    state = update(state, {
      d3: { tool: { $set: action.tool } }
    });
    debug('d3 tool: ', action.tool);
  }
  const tool = state.d3.tool;
  const reducer = reducers[tool];
  if (reducer) {
    return reducer(state, action);
  } else {
    debug('Unkown 3D tool: ', tool);
    return state;
  }
}
