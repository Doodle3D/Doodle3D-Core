import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as THREE from 'three';
import injectSheet from 'react-jss';
import { CANVAS_SIZE } from '../constants/d2Constants';
import ShapesManager from '../d3/ShapesManager';
import { getSelectedObjectsSelector, getBoundingBox } from '../utils/selectionUtils';
import createRAFOnce from '../utils/rafOnce.js';
import { hasExtensionsFor } from '../utils/webGLSupport.js';
import { PIXEL_RATIO } from '../constants/general.js';
import * as toolsNames from '../constants/d3Tools.js';
import { EventScene, EventObject3D } from '../d3/EventScene.js';
import HeightTransformer from '../d3/transformers/HeightTransformer.js';
import TwistTransformer from '../d3/transformers/TwistTransformer.js';
import SculptTransformer from '../d3/transformers/SculptTransformer.js';
import StampTransformer from '../d3/transformers/StampTransformer.js';
import SelectionBox from '../d3/SelectionBox.js';
import RenderChain, { TOONSHADER_OUTLINE, TOONSHADER } from '../d3/RenderChain';
import BaseTransformer from '../d3/transformers/BaseTransformer.js';
import Camera from '../d3/Camera.js';
import ReactResizeDetector from 'react-resize-detector';
// import createDebug from 'debug';
// const debug = createDebug('d3d:d3');

const rafOnce = createRAFOnce();

const CANVAS_WIDTH = CANVAS_SIZE * 2;
const CANVAS_HEIGHT = CANVAS_SIZE * 2;

const tools = {
  [toolsNames.HEIGHT]: HeightTransformer,
  [toolsNames.SCULPT]: SculptTransformer,
  [toolsNames.TWIST]:  TwistTransformer,
  [toolsNames.STAMP]:  StampTransformer
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

class D3Panel extends React.Component {
  constructor(props) {
    super(props);
    this.canvasContainer = React.createRef();
  }

  static propTypes = {
    state: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    classes: PropTypes.objectOf(PropTypes.string)
  };
  needRender = false;

  componentWillMount() {
    this.createScene();

    const shader = hasExtensionsFor.toonShaderPreview ? TOONSHADER_OUTLINE : TOONSHADER;
    this.renderChain = new RenderChain(this.renderer, this.scene, this.camera, shader, {
      UI: this.UIContainer,
      shapes: this.shapesManager,
      boundingBox: this.selectionBox,
      plane: this.plane
    });

    this.DOM = null;
  }

  componentDidMount() {
    if (this.canvasContainer.current) {
      this.container = this.canvasContainer.current;
      this.container.appendChild(this.renderer.domElement);
      this.renderScene(); // immidiatly render because when THREE.JS inits, a black screen is generated
    }
  }

  componentWillUnmount() {
    this.scene.setCanvas(null);
  }

  createScene() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.scene = new EventScene(this.renderer.domElement);
    this.camera = new Camera(50, 1, 1, 10000);
    this.scene.add(this.camera);

    // this.grid = new THREE.GridHelper(200, 20);
    // this.grid.setColors(0xe0e0e0, 0xeeeeee);
    // this.scene.add(this.grid);
    const geometryPlane = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
    geometryPlane.merge(new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT), undefined, 1);

    const materialPlane = [
      new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.BackSide, transparent: true, opacity: 0.3 }),
      new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.FrontSide, transparent: true, opacity: 0.1 })
    ];
    this.plane = new THREE.Mesh(geometryPlane, materialPlane);
    this.plane.rotation.x = Math.PI / 2;
    this.plane.position.y = -0.01;
    this.plane.name = 'bed-plane';
    this.plane.isBedPlane = true;
    this.scene.add(this.plane);

    this.shapesManager = new ShapesManager();

    this.UIContainer = new EventObject3D();
    this.UIContainer.matrixAutoUpdate = false;
    this.UIContainer.name = 'ui-container';

    this.scene.add(this.shapesManager, this.UIContainer);

    this.selectionBox = new SelectionBox();
    this.scene.add(this.selectionBox);
  }

  updateTool(newState) {
    this.switchTool(newState.d3.tool);
    if (this.tool) {
      const toolNeedRender = this.tool.update(newState);
      if (toolNeedRender) this.activeNeedRender = true;
    }
  }

  switchTool(toolName) {
    if (this.state && toolName === this.state.d3.tool) return;
    // cleanup & remove previous tool
    if (this.tool) {
      this.tool.destroy();
      this.UIContainer.remove(this.tool);
    }
    // initialize new tool
    // The tool itself is added to the active object container (Objects Container Space), which is
    // influenced by zooming and panning, but the tool also needs to add objects to the container that
    // isn't; the active scene (Scene Space). For example the wheelContainer, because it needs a
    // mouse position, regardless of zoom level.
    // Each tool also get's the renderRequest callback to request re-renders,
    // even when it won't change the state
    const ToolClass = tools[toolName] ? tools[toolName] : BaseTransformer;
    this.tool = new ToolClass(this.props.dispatch, this.scene, this.camera, this.renderer.domElement);
    this.UIContainer.add(this.tool);

    this.needRender = true;
  }

  update(newState) {
    if (this.state === newState) return;

    if (!this.state || newState.activeSpace !== this.state.activeSpace) {
      const spaceMatrix = newState.spaces[newState.activeSpace].matrix;
      this.UIContainer.matrix.copy(spaceMatrix);
      this.UIContainer.updateMatrixWorld(true);
      this.selectionBox.matrix.copy(spaceMatrix);
      this.selectionBox.updateMatrixWorld(true);
    }

    const selection = (this.state) ? this.state.selection : null;
    const newSelection = newState.selection;

    this.updateTool(newState);

    const meshNeedRender = this.shapesManager.update(newState);
    if (meshNeedRender) this.needRender = true;

    const hasSelections = newSelection.objects.length > 0;
    if (!this.state || newSelection !== selection) {
      const newSelectedObjects = newSelection.objects;
      if (!selection || selection.objects !== newSelectedObjects) {
        const selected = newSelectedObjects.map((object) => object.id);
        this.shapesManager.updateTransparent(selected);

        this.needRender = true;

        this.selectionBox.visible = hasSelections;
      }
      if (hasSelections) {
        this.selectionBox.updateTransform(newSelection.transform);

        this.needRender = true;
      }
    }

    if (!this.state || this.state.d3.camera !== newState.d3.camera) {
      this.camera.update(newState.d3.camera);

      this.needRender = true;
    }

    // NOTE: if there is a selection, any state change will trigger this:
    if (hasSelections) {
      const objectsById = newState.objectsById;
      const selectedShapeDatas = getSelectedObjectsSelector(newSelection.objects, objectsById);
      const boundingBox = getBoundingBox(selectedShapeDatas, newSelection.transform);
      // TODO: add selected shape datas and boundingbox diff checking
      this.selectionBox.updateBoundingBox(boundingBox);
    }

    this.state = newState;
  }

  resizeHandler = (width, height) => {
    // set renderer size
    this.renderChain.setSize(width, height, PIXEL_RATIO, false);

    this.renderRequest();
  };

  renderRequest = () => {
    this.needRender = true;
    rafOnce(this.renderScene);
  };

  render() {
    const { state, classes } = this.props;
    this.update(state);
    rafOnce(this.renderScene);
    return (
      <div className={classes.container}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.resizeHandler} />
        <div className={classes.canvasContainer} ref={this.canvasContainer}/>
      </div>
    );
  }

  renderScene = () => {
    if (this.needRender) {
      this.scene.updateMatrixWorld();
      this.renderChain.render();
      this.needRender = false;
    }
  };
}

// Wrap the component to inject dispatch and state into it
export default injectSheet(styles)(connect(state => ({
  state: state.sketcher.present
}))(D3Panel));
