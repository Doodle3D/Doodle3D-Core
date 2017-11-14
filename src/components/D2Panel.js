import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as CAL from 'cal';
import * as toolNames from 'doodle3d-core/constants/d2Tools';
import { CANVAS_SIZE } from 'doodle3d-core/constants/d2Constants';
import createRAFOnce from 'src/js/utils/rafOnce.js';
import Grid from 'src/js/design/Grid.js';
import BaseTool from 'src/js/design/tools/BaseTool.js';
import TransformTool from 'src/js/design/tools/TransformTool.js';
import EraserTool from 'src/js/design/tools/EraserTool.js';
import BrushTool from 'src/js/design/tools/BrushTool.js';
import PolygonTool from 'src/js/design/tools/PolygonTool.js';
import CircleTool from 'src/js/design/tools/CircleTool.js';
import TextTool from 'src/js/design/tools/TextTool.js';
import BucketTool from 'src/js/design/tools/BucketTool.js';
import PhotoGuideTool from 'src/js/design/tools/PhotoGuideTool.js';
import { PIXEL_RATIO } from 'doodle3d-core/constants/general';
import ShapesManager from 'src/js/design/ShapesManager.js';
import EventGroup from 'src/js/design/EventGroup.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:d2');

const rafOnce = createRAFOnce();

const CANVAS_WIDTH = CANVAS_SIZE * 2;
const CANVAS_HEIGHT = CANVAS_SIZE * 2;

const tools = {
  [toolNames.TRANSFORM]:          TransformTool,
  [toolNames.ERASER]:             EraserTool,
  [toolNames.TEXT]:               TextTool,
  [toolNames.BUCKET]:             BucketTool,
  [toolNames.PHOTO_GUIDE]:        PhotoGuideTool,
  [toolNames.BRUSH]:              BrushTool,
  [toolNames.POLYGON]:            PolygonTool,
  [toolNames.CIRCLE]:             CircleTool
};

// TODO the same as 3d
const styles = {
  container: {
    flexGrow: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    overflow: 'hidden'
  },
  canvas: {
    flexGrow: 1,
    margin: '0px',
    overflow: 'hidden',
    '& canvas': {
      position: 'absolute'
    }
  }
};

class D2Panel extends React.Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    classes: PropTypes.objectOf(PropTypes.string)
  };
  activeNeedRender = false;
  inactiveNeedRender = false;

  componentWillMount() {
    // Scene space
    this.sceneActive = new EventGroup({
      autoClearCanvas: true,
      autoDrawCanvas: true,
      drawWhenBlurred: true
    });
    this.sceneInactive = new CAL.Group({
      autoClearCanvas: true,
      autoDrawCanvas: true,
      drawWhenBlurred: true
    });

    // Objects Container Space
    this.objectContainerActive = new EventGroup();
    this.sceneActive.add(this.objectContainerActive);
    this.objectContainerInactive = new CAL.Group();
    this.sceneInactive.add(this.objectContainerInactive);

    // Grid
    this.objectContainerInactive.add(new Grid(new CAL.Color(0xdddddd)));

    this.shapesManager = new ShapesManager(this.objectContainerActive, this.objectContainerInactive);

    window.addEventListener('resize', this.resizeHandler);

    this.DOM = null;
  }

  componentDidMount() {
    const { canvasContainer, activeScene, inactiveScene } = this.refs;
    console.log('canvasContainer: ', canvasContainer);
    this.container = canvasContainer;

    this.sceneActive.setCanvas(activeScene);
    this.sceneInactive.setCanvas(inactiveScene);
    this.resizeHandler();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeHandler);
  }

  updateTool(newState) {
    this.switchTool(newState.d2.tool);
    if (this.tool) {
      const toolNeedRender = this.tool.update(newState);
      if (toolNeedRender) this.activeNeedRender = true;
    }
  }

  switchTool(toolName) {
    if (this.state && toolName === this.state.d2.tool) return;
    // cleanup & remove previous tool
    if (this.tool) {
      this.tool.destroy();
      this.objectContainerActive.remove(this.tool);
    }
    // initialize new tool
    // The tool itself is added to the active object container (Objects Container Space), which is
    // influenced by zooming and panning, but the tool also needs to add objects to the container that
    // isn't; the active scene (Scene Space). For example the wheelContainer, because it needs a
    // mouse position, regardless of zoom level.
    // Each tool also get's the renderRequest callback to request re-renders,
    // even when it won't change the state
    const ToolClass = tools[toolName] ? tools[toolName] : BaseTool;
    this.tool = new ToolClass(this.props.dispatch, this.sceneActive, this.renderRequest);
    this.objectContainerActive.add(this.tool);
  }

  update(newState) {
    if (this.state === newState) return;

    this.updateTool(newState);

    const shapesNeedRender = this.shapesManager.update(newState);
    if (shapesNeedRender.active) this.activeNeedRender = true;
    if (shapesNeedRender.inactive) this.inactiveNeedRender = true;

    // Update Objects Container Space with zoom & panning
    const newCanvasMatrix = newState.d2.canvasMatrix;
    if (this.state && newCanvasMatrix !== this.state.d2.canvasMatrix) {
      this.objectContainerActive.copyMatrix(newCanvasMatrix);
      this.objectContainerInactive.copyMatrix(newCanvasMatrix);

      this.activeNeedRender = true;
      this.inactiveNeedRender = true;
    }

    const selection = (this.state) ? this.state.selection : null;
    const newSelection = newState.selection;
    if (!this.state || newSelection !== selection) {
      const newSelectedObjects = newSelection.objects;
      if (!selection || selection.objects !== newSelectedObjects) {
        const selected = newSelectedObjects.map((object) => object.id);
        this.shapesManager.updateTransparent(selected);

        this.activeNeedRender = true;
        this.inactiveNeedRender = true;
      }
    }

    const dragSelect = (this.state) ? this.state.d2.transform.dragSelect : null;
    const newDragSelect = newState.d2.transform.dragSelect;
    if (!dragSelect || dragSelect !== newDragSelect) {
      this.activeNeedRender = true;
    }

    this.state = newState;
  }

  resizeHandler = () => {
    const { offsetWidth: width, offsetHeight: height } = this.container;
    this.sceneActive.setSize(width, height, PIXEL_RATIO);
    this.sceneInactive.setSize(width, height, PIXEL_RATIO);

    this.sceneInactive.x = this.sceneActive.x = Math.round(width / 2 * PIXEL_RATIO);
    this.sceneInactive.y = this.sceneActive.y = Math.round(height / 2 * PIXEL_RATIO);

    const scale = Math.min(width * PIXEL_RATIO / CANVAS_WIDTH, height * PIXEL_RATIO / CANVAS_HEIGHT);

    this.sceneInactive.scale = this.sceneActive.scale = scale;

    this.inactiveNeedRender = this.activeNeedRender = true;
    this.renderRequest();
  };

  renderRequest = () => {
    this.activeNeedRender = true;
    rafOnce(this.renderCanvas);
  };

  renderCanvas = () => {
    if (this.activeNeedRender) {
      this.sceneActive.cycle();
      this.activeNeedRender = false;
    }
    if (this.inactiveNeedRender) {
      this.sceneInactive.cycle();
      this.inactiveNeedRender = false;
    }
  };

  stopPropagation(event) {
    // stop propagation to prefent popup to close immidiatly
    event.stopPropagation();
  }

  render() {
    // debug('this.props.state: ', this.props.state);
    const { state, classes } = this.props;
    this.update(state);
    this.renderCanvas();
    return (
      <div className={classes.container}>
        <div className={classes.canvas} ref="canvasContainer">
          <canvas ref="inactiveScene" />
          <canvas onClick={this.stopPropagation} ref="activeScene" />
        </div>
      </div>
    );
  }
}

// Wrap the component to inject dispatch and state into it
export default injectSheet(styles)(connect(state => ({
  state: state.sketcher.present
}))(D2Panel));
