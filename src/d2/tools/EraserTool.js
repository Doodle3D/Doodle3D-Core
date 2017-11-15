import BaseTool from './BaseTool.js';
import EraserPointer from '../EraserPointer.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:2d:tool:eraser');
export default class EraseTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super(dispatch, sceneSpaceContainer, renderRequest);

    this.pointer = new EraserPointer();
    this.pointer.onChanged = renderRequest;
    this.add(this.pointer);
  }
  update(state) {
    const eraserState = state.d2.eraser;
    if (!this._state || this._state !== eraserState) {
      this.pointer.radius = eraserState.size;

      this._state = eraserState;
      return true;
    }
    return false;
  }
}
