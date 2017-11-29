import BaseTool from './BaseTool.js';

export default class PipetteTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer, renderRequest) {
    super(dispatch, sceneSpaceContainer, renderRequest);
    this.enableHitDetection = true;
  }
}
