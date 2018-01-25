import { updateColor } from '../../selectionReducer.js';
import { getColor } from '../../../utils/objectSelectors.js';
import { updateTool as updateTool2d } from '../toolReducer.js';

export default function pipetteReducer(state, action) {
  const [object] = action.objects;
  if (object) {
    const shapeData = state.objectsById[object];
    let color;
    if (shapeData.type === 'IMAGE_GUIDE') {
      color = getColor(shapeData, action.position, action.screenMatrixZoom);
    } else {
      color = shapeData.color;
    }
    state = updateColor(state, color);
  }
  state = updateTool2d(state, state.context.lastTool);
  return state;
}
