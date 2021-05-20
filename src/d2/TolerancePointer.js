import { Vector } from '@doodle3d/cal';
import { PIXEL_RATIO } from '../constants/general.js';

export default class TolerancePointer {
  constructor() {
    this.visible = false;
    this.active = true;
    this.depth = 0;

    this.start = new Vector();
    this.position = new Vector();
  }
  update(trace) {
    this.start.copy(trace.start);
    this.position.copy(trace.position);
  }
  draw(context) {
    context.strokeStyle = '#000000';
    context.lineWidth = 2.0 * PIXEL_RATIO;

    const start = this.start.scale(PIXEL_RATIO);
    const position = this.position.scale(PIXEL_RATIO);

    context.beginPath();
    context.arc(start.x, start.y, 20.0 * PIXEL_RATIO, 0, Math.PI * 2.0, true);

    context.moveTo(start.x, start.y);
    context.lineTo(position.x, position.y);
    context.stroke();
  }
}
