import * as THREE from 'three';
import normalDepthVert from '../../../shaders/normal_depth_vert.glsl';
import normalDepthFrag from '../../../shaders/normal_depth_frag.glsl';
import edgeVert from '../../../shaders/edge_vert.glsl';
import edgeFrag from '../../../shaders/edge_frag.glsl';
import combineVert from '../../../shaders/combine_vert.glsl';
import combineFrag from '../../../shaders/combine_frag.glsl';

export default class OutlinePass {
  constructor(scene, camera, callbackBeforeRender) {
    this.scene = scene;
    this.camera = camera;
    this._callbackBeforeRender = callbackBeforeRender;

    this.clear = true;
    this.renderToScreen = false;

    this._depthNormalRenderTarget = new THREE.WebGLRenderTarget();
    this._edgeRenderTarget = new THREE.WebGLRenderTarget();

    this._normalDepthMateral = new THREE.ShaderMaterial({
      vertexShader: normalDepthVert,
      fragmentShader: normalDepthFrag
    });
    this._normalDepthMateral.side = THREE.DoubleSide;

    this._edgeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't', value: this._depthNormalRenderTarget.texture },
        resolution: { type: 'v2', value: new THREE.Vector2() }
      },
      vertexShader: edgeVert,
      fragmentShader: edgeFrag
    });

    this._copyEdge = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't', value: null },
        uTexArray : { type: 'tv', value: [this._edgeRenderTarget.texture] }
      },
      vertexShader: combineVert,
      fragmentShader: combineFrag
    });

    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._scene = new THREE.Scene();
    this._quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2));
    this._quad.frustumCulled = false;
    this._scene.add(this._quad);
  }

  setSize(width, height) {
    this._depthNormalRenderTarget.setSize(width, height);
    this._edgeRenderTarget.setSize(width, height);
    this._edgeMaterial.uniforms.resolution.value.set(width, height);
  }

  render(renderer, writeBuffer, readBuffer) {
    if (this._callbackBeforeRender) this._callbackBeforeRender();

    this._copyEdge.uniforms.tDiffuse.value = readBuffer.texture;

    this.scene.overrideMaterial = this._normalDepthMateral;
    renderer.render(this.scene, this.camera, this._depthNormalRenderTarget, true);
    this._scene.overrideMaterial = this._edgeMaterial;
    renderer.render(this._scene, this._camera, this._edgeRenderTarget, true);

    this._scene.overrideMaterial = this._copyEdge;
    renderer.render(this._scene, this._camera, this.renderToScreen ? null : writeBuffer, this.clear);

    this.scene.overrideMaterial = null;
    this._scene.overrideMaterial = null;
  }
}
