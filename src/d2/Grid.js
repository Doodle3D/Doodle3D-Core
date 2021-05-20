import { Color, Vector } from '@doodle3d/cal';
import { CANVAS_SIZE, GRID_SIZE } from '../constants/d2Constants';
import { PIXEL_RATIO } from '../constants/general.js';

export default class Grid {
  constructor(color = new Color(0xeeeeee), widthCenter = 2, widthNormal = 1) {
    this.active = false;
    this.visible = true;
    this.depth = -10000;

    this.color = color;
    this.widthCenter = widthCenter;
    this.widthNormal = widthNormal;
  }

  draw(context, matrix) {
    context.save();
    context.lineCap = 'butt';
    context.lineJoin = 'bevel';
    context.globalAlpha = 1;
    context.strokeStyle = this.color.setStroke(context);

    context.beginPath();

    for (let x = -CANVAS_SIZE; x <= CANVAS_SIZE; x += GRID_SIZE) {
      const startLineA = new Vector(x, -CANVAS_SIZE).applyMatrix(matrix);
      const endLineA = new Vector(x, CANVAS_SIZE).applyMatrix(matrix);

      const startLineB = new Vector(-CANVAS_SIZE, x).applyMatrix(matrix);
      const endLineB = new Vector(CANVAS_SIZE, x).applyMatrix(matrix);

      context.moveTo(startLineA.x, startLineA.y);
      context.lineTo(endLineA.x, endLineA.y);

      context.moveTo(startLineB.x, startLineB.y);
      context.lineTo(endLineB.x, endLineB.y);
    }
    context.lineWidth = this.widthNormal * this.parent.sx * PIXEL_RATIO;
    context.stroke();

    const startLineVertical = new Vector(0, -CANVAS_SIZE).applyMatrix(matrix);
    const endLineVertical = new Vector(0, CANVAS_SIZE).applyMatrix(matrix);

    const startLineHorizontal = new Vector(-CANVAS_SIZE, 0).applyMatrix(matrix);
    const endLineHorizontal = new Vector(CANVAS_SIZE, 0).applyMatrix(matrix);

    context.beginPath();

    context.moveTo(startLineVertical.x, startLineVertical.y);
    context.lineTo(endLineVertical.x, endLineVertical.y);

    context.moveTo(startLineHorizontal.x, startLineHorizontal.y);
    context.lineTo(endLineHorizontal.x, endLineHorizontal.y);

    context.lineWidth = this.widthCenter * this.parent.sx * PIXEL_RATIO;

    context.stroke();
  }
}
