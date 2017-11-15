import BaseTool from './BaseTool.js';
import * as actions from '../../actions/index.js';

export default class TextTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super(dispatch, sceneSpaceContainer, renderRequest);
    this.enableHitDetection = true;
  }
  tap({ position, intersections }) {
    const textId = intersections.find(id => this.state.objectsById[id].type === 'TEXT');

    this._dispatch(actions.d2textInit, position, textId);
  }
  update(state) {
    if (state === this.state) return;
    super.update(state);
    this.state = state;
  }
}
