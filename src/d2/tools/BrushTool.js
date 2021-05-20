import BaseTool from './BaseTool.js';
import { Vector } from '@doodle3d/cal';
import { PIXEL_RATIO } from '../../constants/general.js';
import { convertEvent } from '../../utils/pointerUtils.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:2d:tool:eraser');
export default class BrushTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super(dispatch, sceneSpaceContainer, renderRequest);

    this.mousePosition = new Vector();
    this.radius = null;
    this.showMouse = false;
  }
  pointerMove(event) {
    this.showMouse = event.pointerType === 'mouse';
    if (this.showMouse) {
      this.mousePosition.copy(convertEvent(event.target, event));
      this.renderRequest();
    }
  }
  pointerOut() {
    this.showMouse = false;
    this.renderRequest();
  }
  update(state) {
    const eraserState = state.d2.brush;
    if (this.radius !== eraserState.size) {
      this.radius = eraserState.size;
      return true;
    }
    return false;
  }
  draw(context) {
    if (!this.showMouse) return;

    const x = this.mousePosition.x * PIXEL_RATIO;
    const y = this.mousePosition.y * PIXEL_RATIO;
    // not really happy with this.parent.sx * this.parent.parent.sx;
    const radius = this.radius * PIXEL_RATIO * this.parent.sx * this.parent.parent.sx;
    const color = '#72bcd4';
    const alpha = this.erasing ? 1.0 : 0.25;
    const lineWidth = 2.0 * PIXEL_RATIO;

    context.strokeStyle = color;
    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2.0);
    context.stroke();
  }
}
