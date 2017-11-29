import update from 'react-addons-update';
import * as THREE from 'three';
import shortid from 'shortid';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:object');

function generateUID(state) {
  return `S${state.objectIdCounter}`;
}

export function addObject(state, object, UID = generateUID(state)) {
  const { defaultProperties } = SHAPE_TYPE_PROPERTIES[object.type];

  object = {
    ...defaultProperties,
    color: state.context.color,
    solid: state.context.solid,
    space: state.activeSpace,
    ...object,
    UID
  };

  debug('addObject: ', UID);
  state = update(state, {
    spaces: { [object.space]: { objectIds: { $push: [UID] } } },
    objectsById: { [UID]: { $set: object } },
    objectIdCounter: { $set: state.objectIdCounter + 1 }
  });

  return state;
}
export function removeObject(state, UID) {
  debug('removeObject: ', UID);

  const object = state.objectsById[UID];
  const { space } = object;

  const filteredObjectIds = state.spaces[space].objectIds;

  const filteredObjectsById = { ...state.objectsById };
  delete filteredObjectsById[UID];

  return update(state, {
    spaces: { [space]: { objectIds: { $splice: [[filteredObjectIds.indexOf(UID), 1]] } } },
    objectsById: { $set: filteredObjectsById }
  });
}
export function removeAllObjects(state) {
  debug('removeAllObjects: ');

  return update(state, {
    objectsById: { $set: {} },
    activeSpace: { $set: 'world' },
    spaces: { $set: {
      world: {
        matrix: new THREE.Matrix4(),
        objectIds: []
      }
    } }
  });
}
export function setActive2D(state, UID) {
  debug('activeShape: ', UID);
  return update(state, {
    d2: { activeShape: { $set: UID } }
  });
}
export function addObjectActive2D(state, object) {
  const UID = generateUID(state);
  state = addObject(state, object, UID);
  return setActive2D(state, UID);
}
export function removeObjectActive2D(state, UID) {
  const newState = removeObject(state, UID);
  return setActive2D(newState, null);
}

export function getActive2D(state) {
  return state.d2.activeShape ? state.objectsById[state.d2.activeShape] : null;
}

export function addSpaceActive(state, matrix, space = shortid.generate()) {
  state = addSpace(state, matrix, space);
  return setActiveSpace(state, space);
}

export function setActiveSpace(state, space) {
  debug('activeSpace: ', space);
  return update(state, { activeSpace: { $set: space } });
}

export function addSpace(state, matrix, space = shortid.generate()) {
  debug('addSpace: ', space);
  return update(state, {
    spaces: { [space]: { $set: {
      objectIds: [],
      matrix
    } } }
  });
}
