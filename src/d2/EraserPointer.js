import { Vector } from '@doodle3d/cal';
import transposeEvents from '../utils/transposeEvents.js';
import { PIXEL_RATIO } from '../constants/general.js';
import { convertEvent } from '../utils/pointerUtils.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:design:EraserPointer');

export default class EraserPointer {
  constructor() {
    this.visible = true;
    this.active = true;
    this.depth = 20000;

    this.radius = 0;
    this.mousePosition = new Vector();
    this.erasing = false;
    this.showMouse = false;
  }
  onEvent = transposeEvents;
  dragStart({ position }) {
    this.erasing = true;
    this.mousePosition.copy(position);
    if (this.onChanged) this.onChanged();
  }
  dragEnd() {
    this.erasing = false;
    if (this.onChanged) this.onChanged();
  }
  pointerMove(event) {
    this.showMouse = event.pointerType === 'mouse';
    if (this.erasing || this.showMouse) {
      this.mousePosition.copy(convertEvent(event.target, event));
      if (this.onChanged) this.onChanged();
    }
  }
  pointerOut() {
    this.showMouse = false;
    if (this.onChanged) this.onChanged();
  }
  draw(context) {
    if (!this.erasing && !this.showMouse) return;

    const x = this.mousePosition.x * PIXEL_RATIO;
    const y = this.mousePosition.y * PIXEL_RATIO;
    const radius = this.radius * PIXEL_RATIO;
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
