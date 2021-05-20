import { CANVAS_SIZE, INITIAL_IMAGE_SCALE } from '../../constants/d2Constants.js';
import { Matrix } from '@doodle3d/cal';
import { addObject } from '../objectReducers.js';

const IMAGE_SIZE = CANVAS_SIZE * 2 * INITIAL_IMAGE_SCALE;

export default function addImageReducer(state, action) {
  const { payload: imageData } = action;

  const scale = Math.min(IMAGE_SIZE / imageData.width, IMAGE_SIZE / imageData.height);
  const transform = new Matrix();
  transform.scale = scale;

  return addObject(state, { type: 'IMAGE_GUIDE', imageData, transform });
}
