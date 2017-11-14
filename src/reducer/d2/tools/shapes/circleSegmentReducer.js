import circleReducer from './circleReducer.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:circleSegment');

export default function circleSegmentReducer(state, action) {
  if (action.log !== false) debug(action.type);
  return circleReducer(state, action, true);
}
