import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import React from 'react';
import PropTypes from 'proptypes';
import JSONToSketchData from '../shape/JSONToSketchData.js';
import createSceneData from '../d3/createSceneData.js';
import createScene from '../d3/createScene.js';
import injectSheet from 'react-jss';
import ReactResizeDetector from 'react-resize-detector';

const styles = {
  container: {
    height: '100%'
  },
  canvas: {
    position: 'absolute'
  }
};

class DoodlePreview extends React.Component {
  constructor() {
    super();
    this.state = {
      scene: null
    };
  }

  async componentDidMount() {
    let { docData, sketchData } = this.props;

    if (docData) sketchData = await JSONToSketchData(this.props.docData);

    const { canvas } = this.refs;
    const { pixelRatio } = this.props

    const sceneData = createSceneData(sketchData);

    const scene = createScene(sceneData, canvas);
    this.setState(scene);

    this.editorControls = new THREE.EditorControls(scene.camera, canvas);
    this.editorControls.addEventListener('change', () => scene.render());
  }

  componentWillUnmount() {
    if (this.editorControls) this.editorControls.dispose();
  }

  onResize = (width, height) => {
    window.requestAnimationFrame(() => {
      const { setSize } = this.state;
      const { pixelRatio } = this.props;
      setSize(width, height, pixelRatio);
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <canvas className={classes.canvas} ref="canvas" />
      </div>
    );
  }
}
DoodlePreview.defaultProps = {
  width: 720,
  height: 480,
  pixelRatio: 1
};
DoodlePreview.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string),
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  pixelRatio: PropTypes.number.isRequired,
  sketchData: PropTypes.object, // TODO
  docData: PropTypes.shape({
    appVersion: PropTypes.string,
    data: PropTypes.string
  })
};

export default injectSheet(styles)(DoodlePreview);
