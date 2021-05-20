import update from 'react-addons-update';
import * as actions from '../actions/index.js';
import { Vector } from '@doodle3d/cal';
import { shapeToPoints } from '../shape/shapeToPoints.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:selection');

export default function selectionReducer(state, action) {
  // if (action.log !== false) debug(action.type);
  switch (action.type) {
    case actions.SELECT: {
      const { shapeID } = action;
      return selectObject(state, shapeID);
    }

    case actions.BED_SELECT: {
      return update(state, {
        activeSpace: { $set: 'world' }
      });
    }

    case actions.DESELECT: {
      const { shapeID } = action;
      return deselectObject(state, shapeID);
    }

    case actions.TOGGLE_SELECT: {
      const { shapeID } = action;
      return toggleSelectObject(state, shapeID);
    }

    case actions.SELECT_ALL: {
      return state.spaces.world.objectIds.reduce((_state, id) => selectObject(_state, id), state);
    }

    case actions.D2_CHANGE_TOOL:
    case actions.DESELECT_ALL:
      return deselectAll(state);

    case actions.DRAG_SELECT:
      const { start, end } = state.d2.transform.dragSelect;
      const matrix = action.screenMatrixZoom.inverseMatrix();

      const min = new Vector(Math.min(start.x, end.x), Math.min(start.y, end.y)).applyMatrix(matrix);
      const max = new Vector(Math.max(start.x, end.x), Math.max(start.y, end.y)).applyMatrix(matrix);

      return addSelectFromBoundingBox(state, min, max);

    default:
      return state;
  }
}

function addSelectFromBoundingBox(state, min, max) {
  for (const id of state.spaces[state.activeSpace].objectIds) {
    if (isSelected(state, id)) continue;

    const shapeData = state.objectsById[id];
    const compoundPaths = shapeToPoints(shapeData);
    const points = compoundPaths.reduce((a, { points: b }) => a.concat(b), []);

    for (let point of points) {
      point = point.applyMatrix(shapeData.transform);

      if (point.x > min.x && point.y > min.y && point.x < max.x && point.y < max.y) {
        state = selectObject(state, id);

        break;
      }
    }
  }

  return state;
}

function isSelected(state, shapeUID) {
  return state.selection.objects
    .map(({ id }) => id)
    .indexOf(shapeUID) !== -1;
}

function selectObject(state, id) {
  debug('select: ', id);
  if (isSelected(state, id)) return state;

  const { space } = state.objectsById[id];

  const objects = state.selection.objects
    .filter(object => state.objectsById[object.id].space === space);
  objects.push({ id });

  return update(state, {
    activeSpace: { $set: space },
    selection: {
      objects: { $set: objects }
    }
  });
}

function deselectObject(state, id) {
  debug('deselect: ', id);
  if (!isSelected(state, id)) return state;

  const index = state.selection.objects.map((object) => object.id).indexOf(id);
  return update(state, {
    selection: {
      objects: {
        $splice: [[index, 1]]
      }
    }
  });
}

function toggleSelectObject(state, id) {
  if (isSelected(state, id)) {
    return deselectObject(state, id);
  } else {
    return selectObject(state, id);
  }
}

function deselectAll(state) {
  debug('deselect all');
  if (state.selection.objects.length === 0) {
    return state;
  } else {
    return update(state, {
      selection: {
        objects: { $set: [] }
      }
    });
  }
}

export function updateColor(state, color) {
  return update(state, {
    objectsById: state.selection.objects.reduce((updateObject, { id }) => {
      updateObject[id] = {
        color: { $set: color },
        solid: { $set: true }
      };
      return updateObject;
    }, {}),
    context: {
      solid: { $set: true },
      color: { $set: color }
    }
  });
}
