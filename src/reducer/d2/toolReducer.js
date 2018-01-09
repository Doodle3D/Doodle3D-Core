import update from 'react-addons-update';
import circleReducer from './tools/shapes/circleReducer.js';
import circleSegmentReducer from './tools/shapes/circleSegmentReducer.js';
import rectReducer from './tools/shapes/rectReducer.js';
import polyPointReducer from './tools/shapes/polyPointReducer.js';
import heartReducer from './tools/shapes/heartReducer.js';
import starReducer from './tools/shapes/starReducer.js';
import triangleReducer from './tools/shapes/triangleReducer.js';
import bucketReducer from './tools/bucketReducer.js';
import penReducer from './tools/penReducer.js';
import textReducer, { removeEmptyText } from './tools/textReducer.js';
import photoGuideReducer from './tools/photoGuideReducer.js';
import { transformReducer } from './tools/transformReducer.js';
import eraserReducer from './tools/eraserReducer.js';
import pipetteReducer from './tools/pipetteReducer.js';
import * as actions from '../../actions/index.js';
import * as tools from '../../constants/d2Tools.js';
import { PIPETTE } from '../../constants/contextTools.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:d2:tool');

const reducers = {
  [tools.CIRCLE]: circleReducer,
  [tools.CIRCLE_SEGMENT]: circleSegmentReducer,
  [tools.FREE_HAND]: penReducer,
  [tools.RECT]: rectReducer,
  [tools.STAR]: starReducer,
  [tools.TRIANGLE]: triangleReducer,
  [tools.POLY_POINT]: polyPointReducer,
  [tools.HEART]: heartReducer,
  [tools.TRANSFORM]: transformReducer,
  [tools.ERASER]: eraserReducer,
  [tools.POLYGON]: penReducer,
  [tools.PHOTO_GUIDE]: photoGuideReducer,
  [tools.BUCKET]: bucketReducer,
  [tools.TEXT]: textReducer,
  [tools.BRUSH]: penReducer,
  [PIPETTE]: pipetteReducer
};

export default function toolReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  // change 2D tool after explicit tool change action or on some selection
  if (action.type === actions.D2_CHANGE_TOOL) {
    state = updateTool(state, action.tool);
    state = removeEmptyText(state);
  }
  if (action.category === actions.CAT_SELECTION) {
    state = updateTool(state, tools.TRANSFORM);
  }

  const tool = state.d2.tool;
  const reducer = reducers[tool];
  if (reducer) {
    return reducer(state, action);
  } else {
    if (action.log !== false) debug('Unkown 2D tool: ', tool);
    return state;
  }
}

export function updateTool(state, newTool) {
  if (newTool === state.d2.tool) {
    return state;
  } else {
    debug('d2 tool: ', newTool);
    return update(state, {
      d2: { tool: { $set: newTool } }
    });
  }
}
