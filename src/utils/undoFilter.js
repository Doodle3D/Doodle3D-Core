import * as actions from '../actions/index.js';
import * as d2Tools from '../constants/d2Tools.js';
import * as contextTools from '../constants/contextTools.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:util:undoFilter');

const INCLUDE = [
  `${actions.TRACE_FLOOD_FILL}_FULFILLED`,
  `${actions.ADD_IMAGE}_FULFILLED`,
  actions.TOGGLE_SELECT,
  actions.TRANSFORM_END,
  actions.MULTITOUCH_TRANSFORM_END,
  actions.SELECT_ALL,
  actions.DESELECT_ALL,
  actions.STAMP,
  actions.SELECT,
  actions.CLEAR,
  actions.TWIST_END,
  actions.SCULPT_END,
  actions.ADD_SCULPT_HANDLE,
  actions.REMOVE_SCULPT_HANDLE,
  actions.HEIGHT_END,
  actions.DELETE_SELECTION,
  actions.DUPLICATE_SELECTION,
  actions.UNION,
  actions.INTERSECT,
  actions.OPEN_SKETCH,
  actions.D2_CHANGE_TOOL,
  actions.D3_CHANGE_TOOL,
  actions.CONTEXT_CHANGE_TOOL
];

const ACTION_INCLUDES = {
  [actions.D2_DRAG_END]: [...d2Tools.SHAPE_TOOLS, ...d2Tools.PEN_TOOLS, d2Tools.ERASER],
  [actions.D2_TAP]: [...d2Tools.SHAPE_TOOLS, d2Tools.BUCKET, d2Tools.ERASER]
};

const CONTEXT_TOOL_CHANGES = [
  contextTools.ALIGN_LEFT,
  contextTools.ALIGN_HORIZONTAL,
  contextTools.ALIGN_RIGHT,
  contextTools.ALIGN_TOP,
  contextTools.ALIGN_VERTICAL,
  contextTools.ALIGN_BOTTOM
];

export default function undoFilter(action, currentState) {
  if (INCLUDE.includes(action.type)) return true;
  if (ACTION_INCLUDES[action.type] && ACTION_INCLUDES[action.type].includes(currentState.d2.tool)) return true;
  if (action.type === actions.CONTEXT_CHANGE_TOOL && CONTEXT_TOOL_CHANGES.includes(action.tool)) return true;

  return false;
}
