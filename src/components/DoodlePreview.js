import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import React from 'react';
import PropTypes from 'proptypes';
import JSONToSketchData from '../shape/JSONToSketchData.js';
import createSceneData from '../d3/createSceneData.js';
import createScene from '../d3/createScene.js';
import injectSheet from 'react-jss';
import ReactResizeDetector from 'react-resize-detector';
import requestAnimationFrame from 'raf';
import createRAFOnce from '../utils/rafOnce.js';

const rafOnce = createRAFOnce();

const styles = {
  container: {
    height: '100%'
  },
  canvas: {
    position: 'absolute'
  }
};

class DoodlePreview extends React.Component {
  static defaultProps = {
    width: 720,
    height: 480,
    pixelRatio: 1
  };

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  static propTypes = {
    classes: PropTypes.objectOf(PropTypes.string),
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    pixelRatio: PropTypes.number.isRequired,
    sketchData: PropTypes.object, // TODO
    docData: PropTypes.shape({
      appVersion: PropTypes.string,
      data: PropTypes.oneOf([PropTypes.string, PropTypes.object])
    })
  };

  state = {
    scene: null
  };

  async componentDidMount() {
    let { docData, sketchData } = this.props;

    if (docData) sketchData = await JSONToSketchData(docData);

    const sceneData = await createSceneData(sketchData);

    const scene = createScene(sceneData, this.canvas.current);
    this.setState(scene);

    this.editorControls = new THREE.EditorControls(scene.camera, this.canvas.current);
    this.editorControls.addEventListener('change', () => rafOnce(scene.render));
  }

  componentWillUnmount() {
    if (this.editorControls) this.editorControls.dispose();
  }

  resizeHandler = (width, height) => {
    requestAnimationFrame(() => {
      const { setSize } = this.state;
      const { pixelRatio } = this.props;
      setSize(width, height, pixelRatio);
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.resizeHandler} />
        <canvas className={classes.canvas} ref={this.canvas} />
      </div>
    );
  }
}

export default injectSheet(styles)(DoodlePreview);
