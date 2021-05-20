import update from 'react-addons-update';
import { Matrix, Vector } from '@doodle3d/cal';
import { CANVAS_SIZE } from '../../../constants/d2Constants.js';
import * as actions from '../../../actions/index.js';
import { calculateGestureMatrix } from '../../../utils/matrixUtils.js';
import * as selectionUtils from '../../../utils/selectionUtils.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:transform');

const CANVAS_WIDTH = CANVAS_SIZE * 2;
const CANVAS_HEIGHT = CANVAS_SIZE * 2;

export function transformReducer(state, action) {
  // if (action.log !== false) {
  //   debug(action.type);
  // }

  switch (action.category) {
    case actions.CAT_SELECTION:
      state = updateInitTransform(state);
      state = updateTransforms(state);
      break;

    default:
      break;
  }

  switch (action.type) {
    case actions.TRANSFORM_START:
    case actions.TRANSFORM_END: {
      const start = action.type === actions.TRANSFORM_START;
      state = update(state, {
        d2: {
          transform: {
            active: { $set: start },
            handle: { $set: start ? action.handle : '' }
          }
        }
      });

      if (action.handle === 'dragselect' && start) {
        state = update(state, {
          d2: {
            transform: {
              dragSelect: {
                end: { $set: action.position.clone() },
                start: { $set: action.position.clone() }
              }
            }
          }
        });
      }

      return state;
    }

    case actions.TRANSFORM: {
      switch (state.d2.transform.handle) {
        case 'translate':
          return translate(state, action);

        case 'rotate':
          return rotate(state, action);

        case 'scale-lefttop':
        case 'scale-leftbottom':
        case 'scale-rightbottom':
        case 'scale-righttop':
        case 'scale-left':
        case 'scale-bottom':
        case 'scale-right':
        case 'scale-top':
          return scale(state, action);

        case 'dragselect':
          return dragSelect(state, action);

        default:
          return state;
      }
    }

    case actions.MULTITOUCH_TRANSFORM_START:
    case actions.MULTITOUCH_TRANSFORM_END: {
      const start = action.type === actions.MULTITOUCH_TRANSFORM_START;
      state = update(state, {
        d2: {
          transform: {
            active: { $set: start }
          }
        }
      });

      return state;
    }

    case actions.MULTITOUCH_TRANSFORM:
      return multitouch(state, action);

    case actions.MOVE_SELECTION:
      return moveSelection(state, action.deltaX, action.deltaY);

    default:
      return state;
  }
}

function translate(state, { delta, screenMatrixZoom }) {
  delta = delta.applyMatrix(screenMatrixZoom.normalize().inverseMatrix());

  return moveSelection(state, delta.x, delta.y);
}

function rotate(state, { delta, position, screenMatrixZoom }) {
  const transform = state.selection.transform;

  let { center } = getBoundingBox(state, false);
  center = center.applyMatrix(transform);
  const centerScreen = center.applyMatrix(screenMatrixZoom);

  const current = position;
  const start = position.subtract(delta);

  const oldAngle = start.subtract(centerScreen).angle();
  const newAngle = current.subtract(centerScreen).angle();
  const angle = newAngle - oldAngle;

  const rotation = new Matrix().rotateAroundAbsolute(angle, center);

  return containSelectedObjects(updateTransforms(update(state, {
    selection: {
      transform: { $set: transform.multiplyMatrix(rotation) }
    }
  })));
}

function scale(state, { position, screenMatrixZoom }) {
  // let {min, max} = state.selection.boundingBox;
  let { min, max } = getBoundingBox(state, false);

  min = new Vector(min.x, min.z);
  max = new Vector(max.x, max.z);

  let move; // position of corner we are transforming
  let scaleAround; // position of corner to use as reference point
  switch (state.d2.transform.handle) {
    case 'scale-lefttop':
      scaleAround = new Vector(max.x, max.y);
      move = new Vector(min.x, min.y);
      break;

    case 'scale-leftbottom':
      scaleAround = new Vector(max.x, min.y);
      move = new Vector(min.x, max.y);
      break;

    case 'scale-rightbottom':
      scaleAround = new Vector(min.x, min.y);
      move = new Vector(max.x, max.y);
      break;

    case 'scale-righttop':
      scaleAround = new Vector(min.x, max.y);
      move = new Vector(max.x, min.y);
      break;

    case 'scale-top':
      scaleAround = new Vector((min.x + max.x) / 2, max.y);
      move = new Vector((min.x + max.x) / 2, min.y);
      break;

    case 'scale-bottom':
      scaleAround = new Vector((min.x + max.x) / 2, min.y);
      move = new Vector((min.x + max.x) / 2, max.y);
      break;

    case 'scale-left':
      scaleAround = new Vector(max.x, (min.y + max.y) / 2);
      move = new Vector(min.x, (min.y + max.y) / 2);
      break;

    case 'scale-right':
      scaleAround = new Vector(min.x, (min.y + max.y) / 2);
      move = new Vector(max.x, (min.y + max.y) / 2);
      break;

    default:
      throw Error('Unknown corner');
  }
  position = new Vector(position.x, position.y);
  // transform from container space to object space
  const matrix = state.selection.transform.multiplyMatrix(screenMatrixZoom).inverseMatrix();
  const mousePos = position.applyMatrix(matrix);

  const currentSize = move.subtract(scaleAround);
  const newSize = mousePos.subtract(scaleAround);

  let sx;
  let sy;
  switch (state.d2.transform.handle) {
    case 'scale-lefttop':
    case 'scale-leftbottom':
    case 'scale-rightbottom':
    case 'scale-righttop':
      const ratioX = currentSize.x === 0 ? 1 : (newSize.x / currentSize.x);
      const ratioY = currentSize.y === 0 ? 1 : (newSize.y / currentSize.y);

      sx = sy = (Math.abs(ratioX) > Math.abs(ratioY)) ? ratioX : ratioY;

      break;

    case 'scale-top':
    case 'scale-bottom':
      sx = 1;
      sy = currentSize.y === 0 ? 1 : (newSize.y / currentSize.y);

      break;

    case 'scale-left':
    case 'scale-right':
      sx = currentSize.x === 0 ? 1 : (newSize.x / currentSize.x);
      sy = 1;

      break;
    default:
      throw Error('Unknown corner');
  }

  const transform = state.selection.transform;
  const newScale = new Matrix().scaleAroundAbsolute(sx, sy, scaleAround);

  const newState = updateTransforms(update(state, {
    selection: {
      transform: { $set: newScale.multiplyMatrix(transform) }
    }
  }));

  const boundingBox = getBoundingBox(newState, true);

  // TODO: move to constants
  const minX = boundingBox.min.x < -CANVAS_SIZE;
  const minY = boundingBox.min.z < -CANVAS_SIZE;
  const maxX = boundingBox.max.x > CANVAS_SIZE;
  const maxY = boundingBox.max.z > CANVAS_SIZE;

  return (minX || minY || maxX || maxY) ? state : newState;
}

function dragSelect(state, { position }) {
  return update(state, {
    d2: {
      transform: {
        dragSelect: {
          end: { $set: position.clone() }
        }
      }
    }
  });
}

function multitouch(state, { positions, previousPositions, screenMatrixZoom }) {
  const gestureMatrix = calculateGestureMatrix(positions, previousPositions, screenMatrixZoom, {
    rotate: true, scale: true, pan: true
  });

  const transform = state.selection.transform.multiplyMatrix(gestureMatrix);

  return containSelectedObjects(updateTransforms(update(state, {
    selection: {
      transform: { $set: transform }
    }
  })));
}

function moveSelection(state, deltaX, deltaY) {
  const transform = state.selection.transform.translate(deltaX, deltaY);

  return containSelectedObjects(updateTransforms(update(state, {
    selection: {
      transform: { $set: transform }
    }
  })));
}

function containSelectedObjects(state) {
  const boundingBox = getBoundingBox(state, true);
  let transform = new Matrix(state.selection.transform);

  let minX = boundingBox.min.x;
  let minY = boundingBox.min.z;
  let maxX = boundingBox.max.x;
  let maxY = boundingBox.max.z;

  const width = maxX - minX;
  const height = maxY - minY;

  let change = false;
  if (width > CANVAS_WIDTH || height > CANVAS_HEIGHT) {
    change = true;

    const constainFactor = Math.min(CANVAS_WIDTH / width, CANVAS_HEIGHT / height);
    const center = new Vector((maxX + minX) / 2, (maxY + minY) / 2);
    const newScale = new Matrix().scaleAroundAbsolute(constainFactor, constainFactor, center);

    transform = transform.multiplyMatrix(newScale);

    minX = center.x + (minX - center.x) * constainFactor;
    maxX = center.x + (maxX - center.x) * constainFactor;
    maxY = center.y + (maxY - center.y) * constainFactor;
    minY = center.y + (minY - center.y) * constainFactor;
  }

  if (minX < -CANVAS_SIZE) {
    change = true;
    transform.x -= minX + CANVAS_SIZE;
  } else if (maxX > CANVAS_SIZE) {
    change = true;
    transform.x -= maxX - CANVAS_SIZE;
  }

  if (minY < -CANVAS_SIZE) {
    change = true;
    transform.y -= minY + CANVAS_SIZE;
  } else if (maxY > CANVAS_SIZE) {
    change = true;
    transform.y -= maxY - CANVAS_SIZE;
  }

  if (change) {
    return updateTransforms(update(state, {
      selection: { transform: { $set: transform } }
    }));
  } else {
    return state;
  }
}

export function updateInitTransform(state) {
  // Clone object's transform into object's initialTransform
  // Store new Matrix as selection transform
  state = update(state, {
    selection: {
      objects: {
        $set: state.selection.objects.map(({ id }) => {
          const shapeData = state.objectsById[id];
          const initialTransform = new Matrix(shapeData.transform);

          return { id, initialTransform };
        })
      },
      transform: { $set: new Matrix() }
    }
  });

  return state;
}

// update each object's transform with multiplication of object's initial transform with selection transform
function updateTransforms(state) {
  const matrix = state.selection.transform;

  for (const { initialTransform, id } of state.selection.objects) {
    const transform = initialTransform.multiplyMatrix(matrix);

    state = update(state, {
      objectsById: {
        [id]: { transform: { $set: transform } }
      }
    });
  }

  return state;
}

function getBoundingBox(state, axisAligned) {
  const selection = state.selection;
  const selectedShapeDatas = selectionUtils.getSelectedObjectsSelector(selection.objects, state.objectsById);
  if (axisAligned) {
    return selectionUtils.getBoundingBox(selectedShapeDatas);
  } else {
    return selectionUtils.getBoundingBox(selectedShapeDatas, selection.transform);
  }
}
