import update from 'react-addons-update';
import { Matrix } from '@doodle3d/cal';
import constrainMatrix from './constrainMatrix.js';
import { MAX_ZOOM } from '../../constants/d2Constants.js';

export default function d2WheelZoomReducer(state, action) {
  const { position, wheelDelta, screenMatrixContainer } = action;
  const { d2: { canvasMatrix }, disableScroll } = state;

  if (disableScroll) return state;

  const targetScale = 1 + wheelDelta / -500;

  if (canvasMatrix.sx === MAX_ZOOM && targetScale > 1) return state;
  const rotateAround = position.applyMatrix(screenMatrixContainer.inverseMatrix());
  const scaleMatrix = new Matrix().scaleAroundAbsolute(targetScale, targetScale, rotateAround);

  const matrix = canvasMatrix.multiplyMatrix(scaleMatrix);

  constrainMatrix(matrix);

  return update(state, {
    d2: {
      canvasMatrix: { $set: matrix }
    }
  });
}
