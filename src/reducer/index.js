import * as THREE from 'three';
import undoable from 'redux-undo';
import undoFilter from '../utils/undoFilter.js';
import * as actions from '../actions/index.js';
import * as d2Tools from '../constants/d2Tools.js';
import * as d3Tools from '../constants/d3Tools.js';
import { COLOR_STRING_TO_HEX, FONT_FACE } from '../constants/general.js';
import * as contextTools from '../constants/contextTools.js';
import { ERASER_SIZES, BRUSH_SIZES } from '../constants/d2Constants.js';
import update from 'react-addons-update';
import { defaultCamera } from './d3/tools/cameraReducer.js';
import d2AddImageReducer from './d2/addImageReducer.js';
import d2ToolReducer from './d2/toolReducer.js';
import d3ToolReducer from './d3/toolReducer.js';
import d2PinchZoomReducer from './d2/pinchZoomReducer.js';
import d2WheelZoomReducer from './d2/wheelZoomReducer.js';
import d2PanZoomReducer from './d2/panReducer.js';
import selectionReducer from './selectionReducer.js';
import selectionOperationReducer from './selectionOperationReducer.js';
import contextReducer from './contextReducer.js';
import { Matrix, Vector } from '@doodle3d/cal';
import { setActiveSpace, addSpaceActive, setActive2D, getActive2D, addObject } from './objectReducers.js';
import menusReducer from './menusReducer.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:sketcher');

const initialState = {
  spaces: {
    world: {
      matrix: new THREE.Matrix4(),
      objectIds: []
    }
  },
  objectsById: {},
  activeSpace: 'world',
  objectIdCounter: 0,
  context: {
    solid: true,
    color: COLOR_STRING_TO_HEX[contextTools.LIGHT_BLUE_B],
    font: FONT_FACE[contextTools.OSWALD]
  },
  selection: {
    transform: new Matrix(),
    // array of objects (one per selected object),
    // containing the object id and it's initialTransform (pre selection transform)
    objects: []
  },
  d2: {
    brush: {
      size: BRUSH_SIZES[contextTools.BRUSH_SIZE_MEDIUM]
    },
    eraser: {
      active: false,
      size: ERASER_SIZES[contextTools.ERASER_SIZE_MEDIUM]
    },
    transform: {
      active: false,
      handle: '',
      dragSelect: {
        start: new Vector(),
        end: new Vector()
      }
    },
    trace: {
      start: new Vector(),
      position: new Vector(),
      active: false,
      floodFillData: {
        edge: [],
        fill: []
      }
    },
    tool: d2Tools.FREE_HAND,
    toolbar: {
      open: []
    },
    canvasMatrix: new Matrix()
  },
  d3: {
    height: {
      handle: '',
      active: false
    },
    twist: {
      rotation: 0,
      active: false
    },
    sculpt: {
      handles: [],
      activeHandle: null
    },
    tool: d3Tools.HEIGHT,
    toolbar: {
      open: []
    },
    camera: defaultCamera
  },
  menus: menusReducer(undefined, {}),
  preventScroll: true,
  disableScroll: false
};

function sketcherReducer(state = initialState, action) {
  // if (action.log !== false) debug(action.type);

  switch (action.category) {
    case actions.CAT_SELECTION:
      const preSelectionState = state;
      state = selectionReducer(state, action);
      // if selection changed
      if (state.selection.objects !== preSelectionState.selection.objects) {
        state = d2ToolReducer(state, action);
        state = d3ToolReducer(state, action);
        state = updateMenus(state, action);
        state = contextReducer(state, action);
      }
      return state;

    default:
      break;
  }

  switch (action.type) {
    case actions.ADD_OBJECT:
      return addObject(state, action.objectData);

    case actions.D2_DRAG_START:
    case actions.D2_DRAG:
    case actions.D2_DRAG_END:
    case actions.D2_TAP:
    case actions.TRACE_DRAG:
    case actions.TRACE_DRAG_END:
    case actions.TRACE_TAP:
    case `${actions.FLOOD_FILL}_PENDING`:
    case `${actions.FLOOD_FILL}_FULFILLED`:
    case `${actions.FLOOD_FILL}_REJECTED`:
    case `${actions.TRACE_FLOOD_FILL}_PENDING`:
    case `${actions.TRACE_FLOOD_FILL}_FULFILLED`:
    case `${actions.TRACE_FLOOD_FILL}_REJECTED`:
    case actions.TRANSFORM_START:
    case actions.TRANSFORM:
    case actions.TRANSFORM_END:
    case actions.MULTITOUCH_TRANSFORM_START:
    case actions.MULTITOUCH_TRANSFORM:
    case actions.MULTITOUCH_TRANSFORM_END:
    case actions.D2_TEXT_INIT:
    case actions.D2_TEXT_INPUT_CHANGE:
    case actions.MOVE_SELECTION:
      return d2ToolReducer(state, action);

    case `${actions.ADD_IMAGE}_FULFILLED`:
      return d2AddImageReducer(state, action);

    case actions.D2_MOUSE_WHEEL:
      return d2WheelZoomReducer(state, action);

    case actions.D2_SECOND_DRAG:
      return d2PanZoomReducer(state, action);

    case actions.D2_MULTITOUCH_START:
    case actions.D2_MULTITOUCH:
    case actions.D2_MULTITOUCH_END:
      state = d2ToolReducer(state, action);
      state = d2PinchZoomReducer(state, action);
      return state;

    case actions.D3_DRAG_START:
    case actions.D3_DRAG:
    case actions.D3_DRAG_END:
    case actions.D3_SECOND_DRAG_START:
    case actions.D3_SECOND_DRAG:
    case actions.D3_SECOND_DRAG_END:
    case actions.D3_TAP:
    case actions.D3_MOUSE_WHEEL:
    case actions.D3_MULTITOUCH_START:
    case actions.D3_MULTITOUCH:
    case actions.D3_MULTITOUCH_END:
    case actions.HEIGHT_START:
    case actions.HEIGHT:
    case actions.HEIGHT_END:
    case actions.TWIST_START:
    case actions.TWIST:
    case actions.TWIST_END:
    case actions.SCULPT_START:
    case actions.SCULPT:
    case actions.SCULPT_END:
    case actions.ADD_SCULPT_HANDLE:
    case actions.REMOVE_SCULPT_HANDLE:
    case actions.STAMP:
      return d3ToolReducer(state, action);

    case actions.D2_CHANGE_TOOL:
      state = selectionReducer(state, action);
      state = d2ToolReducer(state, action); // switch and initialize tool
      state = updateMenus(state, action);
      state = contextReducer(state, action);
      state = setActive2D(state, null);
      return state;

    case actions.D3_CHANGE_TOOL:
      state = d3ToolReducer(state, action); // switch and initialize tool
      state = updateMenus(state, action);
      return state;

    case actions.CONTEXT_CHANGE_TOOL:
      state = contextReducer(state, action);
      state = updateMenus(state, action);
      return state;

    case actions.CLEAR:
      return update(initialState, {});

    case actions.OPEN_SKETCH:
      let first = true;
      const { spaces } = action.data.data;
      for (const space of spaces) {
        if (first) {
          if (!state.spaces.world) state = addSpaceActive(state, space.matrix, 'world');
        } else {
          state = addSpaceActive(state, space.matrix);
        }

        for (const object of space.objects) {
          if (first) {
            state = addObject(state, { ...object, space: 'world' });
          } else {
            state = addObject(state, object);
          }
        }

        first = false;
      }

      return setActiveSpace(state, 'world');

    case actions.DUPLICATE_SELECTION:
    case actions.DELETE_SELECTION:
    case actions.UNION:
    case actions.INTERSECT:
      return selectionOperationReducer(state, action);

    case actions.MENU_OPEN:
    case actions.MENU_CLOSE:
      return updateMenus(state, action);

    case actions.UPDATE_MATRIX:
      return update(state, {
        objectsById: { [action.id]: { transform: { $set: action.transform } } }
      });

    case actions.SET_PREVENT_SCROLL:
      return update(state, {
        preventScroll: { $set: action.preventScroll }
      });

    case actions.SET_DISABLE_SCROLL:
      return update(state, {
        disableScroll: { $set: action.disableScroll }
      });

    default:
      return state;
  }
}

export default undoable(sketcherReducer, {
  filter: undoFilter,
  initTypes: []
  // debug: true
});


function updateMenus(state, action) {
  return {
    ...state,
    menus: menusReducer(state.menus, action)
  };
}

export function getD2ActiveShape(state) {
  return getActive2D(state);
}

export function isEmpty(state) {
  return Object.keys(state.sketcher.present.objectsById).length === 0;
}
