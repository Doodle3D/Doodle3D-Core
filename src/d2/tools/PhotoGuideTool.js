import BaseTool from './BaseTool.js';
import * as CAL from '@doodle3d/cal';
import TolerancePointer from '../TolerancePointer.js';
import * as actions from '../../actions/index.js';
import { calculateTolerance } from '../../utils/traceUtils';
import { MAX_TRACE_TOLERANCE } from '../../constants/d2Constants';
// import createDebug from 'debug';
// const debug = createDebug('d3d:tool:photoguide');

export default class PhotoGuideTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super(dispatch, sceneSpaceContainer, renderRequest);
    this.enableHitDetection = true;

    this.preview = new CAL.Surface();
    this.preview.visible = false;

    this.maxToleranceView = new CAL.Surface();
    this.maxToleranceView.visible = false;

    this.tolerancePointer = new TolerancePointer();

    this.start = new CAL.Vector();

    this.add(this.maxToleranceView, this.preview, this.tolerancePointer);
  }

  dragStart(event) {
    this.start.copy(event.position);
    this.intersectionId = event.intersections.find(id => this.state.objectsById[id].type === 'IMAGE_GUIDE');
    super.dragStart(event);
  }

  drag(event) {
    if (this.intersectionId) {
      this._dispatch(actions.traceDrag, event.position, this.start, this.intersectionId);
    }
    super.drag(event);
  }

  dragEnd(event) {
    this._dispatch(actions.traceDragEnd);
    super.dragEnd(event);
  }

  tap(event) {
    this._dispatch(actions.traceTap, event.position, event.intersections);
    super.tap(event);
  }

  update(newState) {
    let needRender = false;
    if (newState === this.state) return needRender;
    super.update(newState);

    this.tolerancePointer.visible = newState.d2.trace.active;

    if (!this.state || (this.state && newState.d2.trace !== this.state.d2.trace)) {
      const { trace } = newState.d2;

      needRender = true;

      const maxTolerance = calculateTolerance(trace.start, trace.position) > MAX_TRACE_TOLERANCE;

      this.preview.visible = trace.active && !maxTolerance;
      this.maxToleranceView.visible = trace.active && maxTolerance;
      const UID = newState.d2.activeShape || (this.state ? this.state.d2.activeShape : null);
      if (UID && trace.active) {
        const shapeData = newState.objectsById[UID];
        const { width, height } = shapeData.imageData;

        if (this.preview.image.width !== width || this.preview.image.height !== height) {
          this.preview.centerX = width / 2;
          this.preview.centerY = height / 2;
          this.preview.setSize(width, height);
        }

        this.preview.copyMatrix(shapeData.transform);

        if (this.maxToleranceView.image.width !== width || this.maxToleranceView.image.height !== height) {
          this.maxToleranceView.centerX = width / 2;
          this.maxToleranceView.centerY = height / 2;
          this.maxToleranceView.setSize(width, height);

          this.maxToleranceView.context.fillStyle = 'rgba(255, 0, 0, 0.5)';
          this.maxToleranceView.context.fillRect(0, 0, width, height);
        }

        this.maxToleranceView.copyMatrix(shapeData.transform);

        this.tolerancePointer.update(trace);

        if (trace.floodFillData !== this.state.d2.trace.floodFillData) {
          const imageData = this.preview.context.createImageData(this.preview.width, this.preview.height);

          // Color red trace line based on edges in flood data from state
          for (let i = 0; i < trace.floodFillData.edge.length; i ++) {
            const index = trace.floodFillData.edge[i] * 4;
            imageData.data[index] = 255;
            imageData.data[index + 3] = 255;
          }
          this.preview.context.putImageData(imageData, 0, 0);
        }
      }
    }
    this.state = newState;
    return needRender;
  }
}
