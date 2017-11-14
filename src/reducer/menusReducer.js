import * as actions from '../actions/index.js';
import * as d2Tools from '../constants/d2Tools.js';
import initialMenuStructure from '../constants/menu.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:menu:index');

// flatten & add menu structure
const initialState = addChildren({}, initialMenuStructure);

// read children recursivly and add them flat/unnested to the state
function addChildren(state, childrenData) {
  return childrenData.reduce((reducedState, childData) => {
    reducedState = addItem(reducedState, childData);
    if (childData.children) {
      reducedState = addChildren(reducedState, childData.children);
    }
    return reducedState;
  }, { ...state });
}
function addItem(state, data) {
  state[data.value] = {
    disabled: false,
    selected: '',
    open: false,
    ...data, // override defaults with given data
    children: getChildrenValues(data.children)
  };

  return state;
}
function getChildrenValues(childrenData = []) {
  return childrenData.map(child => child.value);
}

// item specific reducer
function item(state, action) {
  switch (action.type) {
    case actions.MENU_OPEN:
    case actions.MENU_CLOSE:
      return {
        ...state,
        open: (action.type === actions.MENU_OPEN)
      };
    default:
      return state;
  }
}

function getMenu(state, targetValue) {
  if (state[targetValue] === undefined) {
    throw new Error(`Can't find menu item '${targetValue}'`);
  }
  for (const value in state) {
    if (state[value].children.indexOf(targetValue) !== -1) {
      return value;
    }
  }
  return null;
}
export const select = (state, value) => {
  const menuValue = getMenu(state, value);
  // debug(`selectItem: ${value} in ${menuValue}`);
  if (menuValue === null) return state;
  // select value in menu
  state = {
    ...state,
    [menuValue]: {
      ...state[menuValue],
      selected: value
    }
  };
  // try selecting menu in it's menu
  state = select(state, menuValue);
  return state;
};

export default function menusReducer(state = initialState, action) {
  if (action.category === actions.CAT_SELECTION) {
    state = select(state, d2Tools.TRANSFORM);
  }
  switch (action.type) {
    case actions.MENU_OPEN:
    case actions.MENU_CLOSE:
      if (action.menuValue === undefined) return state;
      return {
        ...state,
        [action.menuValue]: item(state[action.menuValue], action)
      };
    case actions.D2_CHANGE_TOOL:
    case actions.D3_CHANGE_TOOL:
    case actions.CONTEXT_CHANGE_TOOL:
      // recursivly select items in menu's
      return select(state, action.tool);
    default:
      return state;
  }
}
