import BaseTool from './BaseTool.js';

export default class BucketTool extends BaseTool {
  constructor(dispatch, sceneSpaceContainer) {
    super(dispatch, sceneSpaceContainer);
    this.enableHitDetection = true;
  }
}
