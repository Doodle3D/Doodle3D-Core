import update from 'react-addons-update';
import constrainMatrix from './constrainMatrix.js';

export default function d2PanReducer(state, action) {
  let { canvasMatrix } = state.d2;
  const matrix = action.screenMatrixContainer.normalize().inverseMatrix();
  const delta = action.position.subtract(action.previousPosition).applyMatrix(matrix);

  canvasMatrix = canvasMatrix.translate(delta.x, delta.y);

  constrainMatrix(canvasMatrix);

  return update(state, {
    d2: {
      canvasMatrix: { $set: canvasMatrix }
    }
  });
}
