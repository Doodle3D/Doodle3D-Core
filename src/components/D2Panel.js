import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as CAL from '@doodle3d/cal';
import * as toolNames from '../constants/d2Tools';
import { PIPETTE } from '../constants/contextTools.js';
import { CANVAS_SIZE } from '../constants/d2Constants';
import createRAFOnce from '../utils/rafOnce.js';
import Grid from '../d2/Grid.js';
import BaseTool from '../d2/tools/BaseTool.js';
import TransformTool from '../d2/tools/TransformTool.js';
import EraserTool from '../d2/tools/EraserTool.js';
import BrushTool from '../d2/tools/BrushTool.js';
import PolygonTool from '../d2/tools/PolygonTool.js';
import CircleTool from '../d2/tools/CircleTool.js';
import PipetteTool from '../d2/tools/PipetteTool.js';
import TextTool from '../d2/tools/TextTool.js';
import BucketTool from '../d2/tools/BucketTool.js';
import PhotoGuideTool from '../d2/tools/PhotoGuideTool.js';
import { PIXEL_RATIO } from '../constants/general';
import ShapesManager from '../d2/ShapesManager.js';
import EventGroup from '../d2/EventGroup.js';
import ReactResizeDetector from 'react-resize-detector';
import InputText from './InputText.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:d2');

const rafOnce = createRAFOnce();

const CANVAS_WIDTH = CANVAS_SIZE * 2;
const CANVAS_HEIGHT = CANVAS_SIZE * 2;

const tools = {
  [toolNames.TRANSFORM]: TransformTool,
  [toolNames.ERASER]: EraserTool,
  [toolNames.TEXT]: TextTool,
  [toolNames.BUCKET]: BucketTool,
  [toolNames.PHOTO_GUIDE]: PhotoGuideTool,
  [toolNames.BRUSH]: BrushTool,
  [toolNames.POLYGON]: PolygonTool,
  [toolNames.CIRCLE]: CircleTool,
  [PIPETTE]: PipetteTool
};

// TODO the same as 3d
const styles = {
  container: {
    flexGrow: 1,
    width: '100%',
    overflow: 'hidden'
  },
  canvasContainer: {
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
  state = {
    screenMatrix: new CAL.Matrix()
  };
  activeNeedRender = false;
  inactiveNeedRender = false;

  constructor(props) {
    super(props);
    this.canvasContainer = React.createRef();
  }

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

    this.DOM = null;
  }

  componentDidMount() {
    if (this.canvasContainer.current) {
      this.container = this.canvasContainer.current;

      this.container.appendChild(this.sceneInactive.image);
      this.container.appendChild(this.sceneActive.image);
    }
    this.sceneActive.onClick = (event) => event.stopPropagation();
  }

  updateTool(newState) {
    this.switchTool(newState.d2.tool);
    if (this.tool) {
      const toolNeedRender = this.tool.update(newState);
      if (toolNeedRender) this.activeNeedRender = true;
    }
  }

  switchTool(toolName) {
    if (this.state.state && toolName === this.state.state.d2.tool) return;
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

  update(state) {
    if (this.state.state === state) return;

    this.updateTool(state);

    const shapesNeedRender = this.shapesManager.update(state);
    if (shapesNeedRender.active) this.activeNeedRender = true;
    if (shapesNeedRender.inactive) this.inactiveNeedRender = true;

    // Update Objects Container Space with zoom & panning
    const newCanvasMatrix = state.d2.canvasMatrix;
    if (this.state.state && newCanvasMatrix !== this.state.state.d2.canvasMatrix) {
      this.objectContainerActive.copyMatrix(newCanvasMatrix);
      this.objectContainerInactive.copyMatrix(newCanvasMatrix);

      this.activeNeedRender = true;
      this.inactiveNeedRender = true;
    }

    const selection = (this.state.state) ? this.state.state.selection : null;
    const newSelection = state.selection;
    if (!this.state.state || newSelection !== selection) {
      const newSelectedObjects = newSelection.objects;
      if (!selection || selection.objects !== newSelectedObjects) {
        const selected = newSelectedObjects.map((object) => object.id);
        this.shapesManager.updateTransparent(selected);

        this.activeNeedRender = true;
        this.inactiveNeedRender = true;
      }
    }

    const dragSelect = (this.state.state) ? this.state.state.d2.transform.dragSelect : null;
    const newDragSelect = state.d2.transform.dragSelect;
    if (!dragSelect || dragSelect !== newDragSelect) {
      this.activeNeedRender = true;
    }

    this.setState({ state });
  }

  resizeHandler = (width, height) => {
    this.sceneActive.setSize(width, height, PIXEL_RATIO);
    this.sceneInactive.setSize(width, height, PIXEL_RATIO);

    const x = Math.round(width / 2 * PIXEL_RATIO);
    const y = Math.round(height / 2 * PIXEL_RATIO);
    const scale = Math.min(width * PIXEL_RATIO / CANVAS_WIDTH, height * PIXEL_RATIO / CANVAS_HEIGHT);

    const screenMatrix = new CAL.Matrix({ sx: scale, sy: scale, x, y });

    this.sceneInactive.copyMatrix(screenMatrix);
    this.sceneActive.copyMatrix(screenMatrix);

    this.setState({ screenMatrix });

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

  render() {
    // debug('this.props.state: ', this.props.state);
    const { state, classes } = this.props;
    const { screenMatrix } = this.state;
    this.update(state);
    this.renderCanvas();
    return (
      <div className={classes.container}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.resizeHandler} />
        <div className={classes.canvasContainer} ref={this.canvasContainer} />
        <InputText screenMatrix={screenMatrix} />
      </div>
    );
  }
}

// Wrap the component to inject dispatch and state into it
export default injectSheet(styles)(connect(state => ({
  state: state.sketcher.present
}))(D2Panel));
