import * as THREE from 'three';
import anaglyphVert from '../../../shaders/anaglyph_vert.glsl';
import anaglyphFrag from '../../../shaders/anaglyph_frag.glsl';

const COLOR_MATRIX_LEFT = new THREE.Matrix3().fromArray([
  1.0671679973602295, -0.0016435992438346148, 0.0001777536963345483,
  -0.028107794001698494, -0.00019593400065787137, -0.0002875397040043026,
  -0.04279090091586113, 0.000015809757314855233, -0.00024287120322696865
]);
const COLOR_MATRIX_RIGHT = new THREE.Matrix3().fromArray([
  -0.0355340838432312, -0.06440307199954987, 0.018319187685847282,
  -0.10269022732973099, 0.8079727292060852, -0.04835830628871918,
  0.0001224992738571018, -0.009558862075209618, 0.567823588848114
]);

export default class AnaglyphPass {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.clear = true;
    this.renderToScreen = false;

    const params = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    };

    this._stereo = new THREE.StereoCamera();

    this._renderTargetL = new THREE.WebGLRenderTarget(1, 1, params);
    this._renderTargetR = new THREE.WebGLRenderTarget(1, 1, params);

    this._material = new THREE.ShaderMaterial({
      uniforms: {
        mapLeft: { value: this._renderTargetL.texture },
        mapRight: { value: this._renderTargetR.texture },
        colorMatrixLeft: { value: COLOR_MATRIX_LEFT },
        colorMatrixRight: { value: COLOR_MATRIX_RIGHT }
      },
      vertexShader: anaglyphVert,
      fragmentShader: anaglyphFrag
    });

    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._scene = new THREE.Scene();
    this._quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this._material);
    this._quad.frustumCulled = false;
    this._scene.add(this._quad);
  }

  setSize(width, height, pixelRatio = 1) {
    this._renderTargetL.setSize(width * pixelRatio, height * pixelRatio);
    this._renderTargetR.setSize(width * pixelRatio, height * pixelRatio);
  }

  render(renderer, writeBuffer, readBuffer) {
    this.scene.updateMatrixWorld();
    this._stereo.update(this.camera);

    renderer.render(this.scene, this._stereo.cameraL, this._renderTargetL, true);
    renderer.render(this.scene, this._stereo.cameraR, this._renderTargetR, true);
    renderer.render(this._scene, this._camera, this.renderToScreen ? null : readBuffer, this.clear);
  }
}
