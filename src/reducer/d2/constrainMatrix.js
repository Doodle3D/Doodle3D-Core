import { Vector, Utils as CALUtils } from '@doodle3d/cal';
import { MIN_ZOOM, MAX_ZOOM, CANVAS_SIZE } from '../../constants/d2Constants.js';

export default function constrainMatrix(matrix) {
  const scale = matrix.sx;
  const scaleClamped = CALUtils.MathExtended.clamb(scale, MIN_ZOOM, MAX_ZOOM);
  matrix.scale = scaleClamped;

  const pan = new Vector().copy(matrix).scale(scaleClamped / scale);
  const maxTranslate = (CANVAS_SIZE / MIN_ZOOM - CANVAS_SIZE / scaleClamped) * scaleClamped;

  matrix.x = CALUtils.MathExtended.clamb(pan.x, -maxTranslate, maxTranslate);
  matrix.y = CALUtils.MathExtended.clamb(pan.y, -maxTranslate, maxTranslate);
  matrix.rotation = 0;
}
