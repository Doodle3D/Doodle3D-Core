import update from 'react-addons-update';
import * as actions from '../../../actions/index.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:sculpt');
import { SHAPE_TYPE_PROPERTIES } from '../../../constants/shapeTypeProperties.js';
import * as d3Tools from '../../../constants/d3Tools';

// state.d3.sculpt.handles: [
//   {
//     pos: number // position of handle
//     scale: number // scale of handle
//     ids: [ // list of sculpt steps this handle influences
//       {
//         id: number // object id
//         index: number // sculpt index
//       }
//     ]
//   }
// ]

const CHANGE_FACTOR = 0.005; // 0.5;
const HANDLES_MERGE_DISTANCE = 2.0;

export function init(state) {
  return state;
}

export default function sculptReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  switch (action.category) {
    case actions.CAT_SELECTION:
      return initSculpt(state);

    default:
      break;
  }

  switch (action.type) {

    case actions.D3_CHANGE_TOOL:
      return initSculpt(state);

    case actions.ADD_SCULPT_HANDLE: {
      const pos = action.height;
      const { handles } = state.d3.sculpt;

      // find index of new handle based on position
      const index = handles.findIndex(handle => action.height < handle.pos);
      if (index === -1) return state;

      // interpolate scale based on handles above and below new handle
      const alpha = (action.height - handles[index - 1].pos) / (handles[index].pos - handles[index - 1].pos);
      const scale = handles[index].scale * alpha + handles[index - 1].scale * (1 - alpha);

      state = update(state, {
        d3: {
          sculpt: {
            handles: {
              $splice: [[index, 0, { pos, scale, ids: [] }]]
            },
            activeHandle: { $set: action.start ? index : null }
          }
        }
      });

      state = addHandles(state, index, pos);

      return state;
    }

    case actions.REMOVE_SCULPT_HANDLE: {
      const { handles } = state.d3.sculpt;
      const removedHandleIndex = action.heightIndex;

      // you can't remove top and bottom handles
      if (removedHandleIndex === 0 || removedHandleIndex === handles.length - 1) return state;

      const removedHandle = handles[removedHandleIndex];
      // retrieve sculpt steps handled by this handle which can be removed
      // removable sculpt steps are steps that aren't the top and bottom steps of objects
      const removableSculptSteps = removedHandle.ids
        .filter(sculptStep => isRemovableSculptStep(state, sculptStep));
      // retrieve sculpt steps handled by this handle which can't be removed
      const nonRemovableSculptSteps = removedHandle.ids
        .filter(sculptStep => !isRemovableSculptStep(state, sculptStep));

      // update handles
      // if all sculpt handles controlled by this handle can be removed, remove handle
      if (nonRemovableSculptSteps.length === 0) {
        state = updateHandles(state, {
          $splice: [[removedHandleIndex, 1]]
        });
      // else remove just the objects of which the sculpt steps can be removed
      } else {
        state = updateHandles(state, {
          [removedHandleIndex]: {
            ids: {
              $set: nonRemovableSculptSteps
            }
          }
        });
      }

      // convert sculpt steps of removed handle into
      // objects collection with per object it's removed indexes
      const objects = sculptStepsToObjects(removableSculptSteps);

      // Remove sculpt steps from objects
      state = update(state, {
        objectsById: Object.entries(objects)
          .reduce((updateObject, [id, indexes]) => {
            updateObject[id] = {
              sculpt: {
                $splice: [[indexes[0], indexes.length]]
              }
            };
            return updateObject;
          }, {})
      });

      // Update sculpt step indexes in handles
      state = updateHandles(state, state.d3.sculpt.handles.reduce((updateObject, handle, handleIndex) => {
        // go through handle's sculpt steps
        for (const key in handle.ids) {
          const { id, index } = handle.ids[key];
          const removedIndexes = objects[id];
          // if a sculpt step index is higher than a removed step
          if (removedIndexes && index > removedIndexes[0]) {
            // add update object for handle if needed
            if (!updateObject[handleIndex]) updateObject[handleIndex] = { ids: {} };
            // update index of handle's sculpt step
            updateObject[handleIndex].ids[key] = { index: { $set: index - removedIndexes.length } };
          }
        }
        return updateObject;
      }, {}));

      return state;
    }

    case actions.SCULPT_START: {
      const { pos } = state.d3.sculpt.handles[action.heightIndex];
      const index = action.heightIndex;

      state = update(state, {
        d3: {
          sculpt: {
            activeHandle: { $set: index }
          }
        }
      });
      state = addHandles(state, index, pos);

      return state;
    }

    case actions.SCULPT_END: {
      return update(state, {
        d3: {
          sculpt: {
            activeHandle: { $set: null }
          }
        }
      });
    }

    case actions.SCULPT: {
      const delta = action.delta * CHANGE_FACTOR;
      const heightIndex = state.d3.sculpt.activeHandle;
      const selectionScale = Math.max(0.1, state.d3.sculpt.handles[heightIndex].scale + delta);

      state = update(state, {
        d3: { sculpt: { handles: { [heightIndex]: { scale: { $set: selectionScale } } } } }
      });

      for (const { id, index } of state.d3.sculpt.handles[heightIndex].ids) {
        const shapeData = state.objectsById[id];
        if (!SHAPE_TYPE_PROPERTIES[shapeData.type].tools[d3Tools.SCULPT]) continue;

        const shapeScale = Math.max(0.1, shapeData.sculpt[index].scale + delta);
        state = update(state, {
          objectsById: { [id]: { sculpt: { [index]: { scale: { $set: shapeScale } } } } }
        });
      }

      return state;
    }

    default:
      return state;
  }
}

// go through sculpt steps and group / nest them per object
// sort the indexes per objects
function sculptStepsToObjects(sculptSteps) {
  const objects = sculptSteps.reduce((result, { id, index }) => {
    if (result[id] === undefined) result[id] = [];
    result[id].push(index);
    return result;
  }, {});
  for (const id in objects) {
    objects[id].sort((a, b) => a - b);
  }
  return objects;
}

function isRemovableSculptStep(state, sculptStep) {
  const { id, index } = sculptStep;
  const { sculpt } = state.objectsById[id];

  return index !== 0 && index !== sculpt.length - 1;
}

function updateHandles(state, handlesUpdates) {
  return update(state, {
    d3: {
      sculpt: {
        handles: handlesUpdates
      }
    }
  });
}

function initSculpt(state) {
  const sculpt = getInitialSculpt(state);
  return update(state, {
    d3: {
      sculpt: {
        handles: { $set: sculpt }
      }
    }
  });
}

function getInitialSculpt(state) {
  // determine initial sculpt
  return state.selection.objects
    .map(({ id }) => state.objectsById[id])
    // get sculpt steps per object
    .map(({ sculpt, UID, z, height }) => {
      return sculpt.map(({ pos, scale }) => ({
        pos: pos * height + z,
        scale,
        id: UID
      }));
    })
    // convert to handles
    .reduce((handles, sculpt) => {
      for (let index = 0; index < sculpt.length; index ++) {
        const { pos, scale, id } = sculpt[index];
        // if there is already a handle nearby
        const nearbyHandle = handles.find(handle => Math.abs(handle.pos - pos) < HANDLES_MERGE_DISTANCE);
        if (nearbyHandle) {
          // have the same handle also influence this object
          nearbyHandle.ids.push({ id, index });
        } else {
          // otherwise create new handle
          handles.push({
            pos,
            scale: state.selection.objects.length === 1 ? scale : 1.0,
            ids: [{ id, index }]
          });
        }
      }
      return handles;
    }, [])
    // sort on y position
    .sort((a, b) => a.pos - b.pos);
}

// add sculpt steps if needed and id added update existing sculpt steps
function addHandles(state, addedHandleIndex, pos) {
  const { handles } = state.d3.sculpt;

  // id's of objects that are already handled by handle
  const objectIds = handles[addedHandleIndex].ids.map(({ id }) => id);
  for (const { id } of state.selection.objects) {
    // if selected object is already handled by handle skip
    if (objectIds.includes(id)) continue;

    // calculate relative y position (0 - 1) within object
    const { z, height, sculpt } = state.objectsById[id];
    const handlePos = (pos - z) / height;

    // if handle position is above of below an object skip
    if (handlePos <= 0.0 || handlePos >= 1.0) continue;

    // find index of new sculpt step based on position
    const index = sculpt.findIndex(handle => handlePos < handle.pos);

    // interpolate scale based on sculpt steps above and below
    const alpha = (handlePos - sculpt[index - 1].pos) / (sculpt[index].pos - sculpt[index - 1].pos);
    const scale = sculpt[index].scale * alpha + sculpt[index - 1].scale * (1 - alpha);

    // add handle
    state = updateHandles(state, {
      // add object to handle
      [addedHandleIndex]: {
        ids: { $push: [{ id, index }] }
      }
    });
    // add sculpt step to object
    state = update(state, {
      objectsById: {
        [id]: {
          sculpt: {
            $splice: [[index, 0, {
              pos: handlePos,
              scale
            }]]
          }
        }
      }
    });
  }

  // per handle: update sculpt step indexes by incrementing all higher indexes
  state = updateHandles(state, state.d3.sculpt.handles.reduce((updateObject, handle, handleIndex) => {
    // skip current and lower handles
    if (handleIndex <= addedHandleIndex) return updateObject;
    for (const key in handle.ids) {
      const { index, id } = handle.ids[key];

      // skip sculpt steps for objects that are already handled by current handle
      if (objectIds.includes(id)) continue;

      // add update object for handle if needed
      if (!updateObject[handleIndex]) updateObject[handleIndex] = { ids: {} };
      // update index of handle's sculpt step
      updateObject[handleIndex].ids[key] = { index: { $set: index + 1 } };
    }
    return updateObject;
  }, {}));

  return state;
}
