import { shapeToPoints } from '../shape/shapeToPoints.js';
import { shapeChanged } from '../shape/shapeDataUtils.js';
import { Matrix } from '@doodle3d/cal';
import { LINE_WIDTH } from '../constants/d2Constants.js';
import { hexToStyle } from '../utils/colorUtils.js';
import { DESELECT_TRANSPARENCY, FILL_TRANSPARENCY, LINE_TRANSPARENCY } from '../constants/d2Constants.js';
import { PIXEL_RATIO } from '../constants/general.js';
import holePaternUrl from '../../img/holepatern.png';
import { loadImage } from '../utils/imageUtils.js';

let holePatern;
export const load = loadImage(holePaternUrl).then(image => {
  holePatern = document.createElement('canvas').getContext('2d').createPattern(image, 'repeat');
});

export default class Shape extends Matrix {
  constructor(shapeData) {
    super();

    this.visible = true;
    this.active = false;
    this.depth = shapeData.height + shapeData.z;

    this.color = '';

    this.UID = shapeData.UID;

    this.update(shapeData);
    this.setOpaque(true);
  }
  update(shapeData) {
    let changed = false;

    this.depth = shapeData.height + shapeData.z;

    if (!this._shapeData || shapeChanged(shapeData, this._shapeData)) {
      this.shapes = shapeToPoints(shapeData);

      changed = true;
    }

    if (!this._shapeData || this._shapeData.transform !== shapeData.transform) {
      if (shapeData.transform.matrix.some(value => typeof value !== 'number' || isNaN(value))) {
        throw new Error(`Cannot update object ${this.UID}: transform contains invalid values.`);
      }

      this.copyMatrix(shapeData.transform);

      changed = true;
    }

    if (!this._shapeData || this._shapeData.color !== shapeData.color) {
      if (typeof shapeData.color !== 'number' || isNaN(shapeData.color)) {
        throw new Error(`Cannot update object ${this.UID}: color is an invalid value.`);
      }
      this.color = hexToStyle(shapeData.color);
      changed = true;
    }

    if (!this._shapeData || this._shapeData.solid !== shapeData.solid) {
      changed = true;
    }

    this._shapeData = shapeData;
    return changed;
  }
  setOpaque(opaque) {
    const selectTransparency = this._shapeData.fill ? FILL_TRANSPARENCY : LINE_TRANSPARENCY;
    this.alpha = opaque ? selectTransparency : DESELECT_TRANSPARENCY;
  }
  draw(context, matrix) {
    context.beginPath();

    for (let i = 0; i < this.shapes.length; i ++) {
      const { points, holes } = this.shapes[i];

      for (let j = 0; j < points.length; j ++) {
        const point = points[j].applyMatrix(matrix);

        if (j === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      }

      for (let j = 0; j < holes.length; j ++) {
        const hole = holes[j];

        for (let k = 0; k < hole.length; k ++) {
          const point = hole[k].applyMatrix(matrix);

          if (k === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        }
      }
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';

    const lineWidth = PIXEL_RATIO * LINE_WIDTH;

    context.globalAlpha = this.alpha;
    if (this._shapeData.fill) {
      context.fillStyle = this._shapeData.solid ? this.color : holePatern;
      context.fill();

      context.strokeStyle = 'black';
      context.lineWidth = lineWidth / 2.0;
      context.stroke();
    } else {
      const outerLineWidth = lineWidth * this.parent.sx;
      const innerLineWidth = outerLineWidth - lineWidth;

      context.strokeStyle = 'black';
      context.lineWidth = outerLineWidth;
      context.stroke();

      if (innerLineWidth > 0) {
        context.strokeStyle = this._shapeData.solid ? this.color : holePatern;
        context.lineWidth = innerLineWidth;
        context.stroke();
      }
    }
  }
}
