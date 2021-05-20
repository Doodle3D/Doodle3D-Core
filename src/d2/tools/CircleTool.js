import { Vector } from '@doodle3d/cal';
import BaseTool from './BaseTool.js';
import * as humanReadable from '../../utils/humanReadable.js';
import { dimensionsText } from '../texts.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:2d:tool:circle');

export default class PolygonTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super(dispatch, sceneSpaceContainer, renderRequest);

    this.drawRuler = false;
    this.rulerLength = 0;
    this.rulerPosition = new Vector();
  }
  update(state) {
    const activeShape = state.d2.activeShape && state.objectsById[state.d2.activeShape];
    if (activeShape) {
      this.drawRuler = true;

      this.rulerPosition.copy(new Vector().applyMatrix(activeShape.transform));
      this.rulerLength = activeShape.circle.radius;

      return true;
    } else if (this.drawRuler) {
      this.drawRuler = false;

      return true;
    }
    return false;
  }
  draw(context, matrix) {
    if (this.drawRuler) {
      context.beginPath();

      const rulerStart = this.rulerPosition.applyMatrix(matrix);
      const rulerEnd = this.rulerPosition.add(new Vector(this.rulerLength, 0)).applyMatrix(matrix);

      context.moveTo(rulerStart.x, rulerStart.y);
      context.lineTo(rulerEnd.x, rulerEnd.y);

      context.lineWidth = 2;
      context.strokeStyle = '#333';
      context.stroke();

      const rulerPosition = rulerStart.add(rulerEnd).scale(0.5).add(new Vector(0, -5));
      const text = humanReadable.distance(this.rulerLength);
      dimensionsText.drawText(context, text, rulerPosition.x, rulerPosition.y);
    }
  }
}
