export default class RenderChain {
  constructor(renderer, scene, camera) {
    this._renderer = renderer;
    this._scene = scene;
    this._camera = camera;
  }

  setSize(width, height) {
    this._renderer.setSize(width, height);

    // adjust aspect ratio of camera
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
  }

  render() {
    this._renderer.render(this._scene, this._camera);
  }
}
