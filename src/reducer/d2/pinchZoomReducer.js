import update from 'react-addons-update';
import constrainMatrix from './constrainMatrix.js';
import { calculateGestureMatrix } from '../../utils/matrixUtils.js';
import * as actions from '../../actions/index.js';
import createDebug from 'debug';
const debug = createDebug('d3d:reducer:d2:pinchZoom');

export default function pinchZoomReducer(state, action) {
  if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.D2_MULTITOUCH:
      return multitouch(state, action);

    default:
      return state;
  }
}

function multitouch(state, { positions, previousPositions, screenMatrixContainer }) {
  const gestureMatrix = calculateGestureMatrix(positions, previousPositions, screenMatrixContainer, {
    rotate: false, scale: true, pan: true
  });

  const { canvasMatrix } = state.d2;
  const matrix = canvasMatrix.multiplyMatrix(gestureMatrix);

  constrainMatrix(matrix);

  return update(state, {
    d2: {
      canvasMatrix: { $set: matrix }
    }
  });
}
