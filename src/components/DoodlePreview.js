import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import React from 'react';
import PropTypes from 'proptypes';
import JSONToSketchData from '../shape/JSONToSketchData.js';
import createSceneData from '../d3/createSceneData.js';
import createScene from '../d3/createScene.js';

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
    const { width, height, pixelRatio } = this.props

    const sceneData = createSceneData(sketchData);

    const scene = createScene(sceneData, canvas);
    this.setState({ scene });

    scene.setSize(width, height, pixelRatio);
    scene.render();

    this.editorControls = new THREE.EditorControls(scene.camera, canvas);
    this.editorControls.addEventListener('change', () => scene.render());
  }

  componentDidUpdate(prevProps) {
    const { scene } = this.state;
    const { width, height } = this.props;
    if (scene !== null && (prevProps.width !== width || prevProps.height !== height)) {
      scene.setSize(width, height);
      scene.render();
    }
  }

  render() {
    const { width, height } = this.props;
    return (
        <canvas width={width} height={height} ref="canvas" />
    );
  }
}
DoodlePreview.defaultProps = {
  width: 720,
  height: 480,
  pixelRatio: 1
};
DoodlePreview.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  pixelRatio: PropTypes.number.isRequired,
  sketchData: PropTypes.object, // TODO
  docData: PropTypes.shape({
    appVersion: PropTypes.string,
    data: PropTypes.string
  })
};

export default DoodlePreview;
