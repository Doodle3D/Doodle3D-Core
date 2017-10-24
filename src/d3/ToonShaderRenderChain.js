import * as THREE from 'three';
import 'three/examples/js/postprocessing/EffectComposer.js';
import 'three/examples/js/postprocessing/RenderPass.js';
import 'three/examples/js/postprocessing/ShaderPass.js';
import 'three/examples/js/shaders/CopyShader.js';
import vertexShaderPostprocessing from './shaders/vertexShaderPostprocessing.js';
import fragmentShaderSobelDepth from './shaders/fragmentShaderSobelDepth.js';
import fragmentShaderSobelNormal from './shaders/fragmentShaderSobelNormal.js';
import fragmentShaderCombineTextures from './shaders/fragmentShaderCombineTextures.js';
import fragmentShaderDepth from './shaders/fragmentShaderDepth.js';
import vertexShaderDepth from './shaders/vertexShaderDepth.js';

// Based on Doodle3D/Toon-Shader

// initize render targets with default canvas size
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 200;

const NORMAL_MATERIAL = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
const DEPTH_MATERIAL = new THREE.ShaderMaterial({
  uniforms: {
    mNear: { type: 'f', value: 1.0 },
    mFar: { type: 'f', value: 3000.0 },
    opacity: { type: 'f', value: 1.0 },
    logDepthBufFC: { type: 'f', value: 2.0 }
  },
  vertexShader: vertexShaderDepth,
  fragmentShader: fragmentShaderDepth,
  side: THREE.DoubleSide
});

export default class Composer {
  constructor(renderer, scene, camera, groups) {
    this._renderer = renderer;
    this._scene = scene;
    this._camera = camera;
    this._groups = groups;

    this._aspect = new THREE.Vector2(DEFAULT_WIDTH, DEFAULT_HEIGHT);

    const {
      composer: composerDepth,
      renderTarget: renderTargetDepth
    } = this._createSobelComposer(DEPTH_MATERIAL, 0.005, fragmentShaderSobelDepth);

    this._composerDepth = composerDepth;

    const {
      composer: composerNormal,
      renderTarget: renderTargetNormal
    } = this._createSobelComposer(NORMAL_MATERIAL, 0.5, fragmentShaderSobelNormal);

    this._composerNormal = composerNormal;

    const renderTargetUI = new THREE.WebGLRenderTarget(DEFAULT_WIDTH, DEFAULT_HEIGHT, {
      format: THREE.RGBAFormat
    });
    this._composerUI = new THREE.EffectComposer(this._renderer, renderTargetUI);
    this._composerUI.addPass(new THREE.RenderPass(scene, camera));
    this._composerUI.addPass(new THREE.ShaderPass(THREE.CopyShader));

    this._composer = new THREE.EffectComposer(renderer);
    this._composer.addPass(new THREE.RenderPass(scene, camera, undefined, new THREE.Color(0xffffff), 1.0));
    const combineComposers = new THREE.ShaderPass(new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't' },
        tNormal: { type: 't', value: renderTargetNormal.texture },
        tDepth: { type: 't', value: renderTargetDepth.texture },
        tUI: { type: 't', value: renderTargetUI.texture }
      },
      vertexShader: vertexShaderPostprocessing,
      fragmentShader: fragmentShaderCombineTextures
    }));
    combineComposers.renderToScreen = true;
    this._composer.addPass(combineComposers);
  }

  _createSobelComposer(material, threshold, fragmentShader) {
    const renderTarget = new THREE.WebGLRenderTarget(DEFAULT_WIDTH, DEFAULT_HEIGHT, {
      format: THREE.RGBFormat
    });

    const composer = new THREE.EffectComposer(this._renderer, renderTarget);

    composer.addPass(new THREE.RenderPass(this._scene, this._camera, material));

    const sobelShader = new THREE.ShaderPass(new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't' },
        threshold: { type: 'f', value: threshold },
        aspect: { type: 'v2', value: this._aspect }
      },
      vertexShader: vertexShaderPostprocessing,
      fragmentShader
    }));
    composer.addPass(sobelShader);

    composer.addPass(new THREE.ShaderPass(THREE.CopyShader));

    return { renderTarget, composer };
  }

  setSize(width, height, pixelRatio) {
    this._renderer.setPixelRatio(pixelRatio);
    this._renderer.setSize(width, height);

    this._aspect.set(width, height);

    // adjust aspect ratio of camera
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    width *= pixelRatio;
    height *= pixelRatio;

    this._composer.setSize(width, height);
    this._composerNormal.setSize(width, height);
    this._composerDepth.setSize(width, height);
    this._composerUI.setSize(width, height);
  }

  getCurrentVisibleValues() {
    const visibleValues = {};

    for (const key in this._groups) {
      visibleValues[key] = this._groups[key].visible;
    }

    return visibleValues;
  }

  setVisible(initalValues, visibleGroups) {
    for (const key in this._groups) {
      const group = this._groups[key];

      if (visibleGroups.indexOf(group) !== -1) {
        group.visible = initalValues[key];
      } else {
        group.visible = false;
      }
    }
  }

  render() {
    const initalValues = this.getCurrentVisibleValues();

    const shapes = this._groups.shapes;
    const UI = this._groups.UI;
    const plane = this._groups.plane;
    const boundingBox = this._groups.boundingBox;

    this.setVisible(initalValues, [shapes]);
    this._composerDepth.render();
    this._composerNormal.render();

    this.setVisible(initalValues, [UI]);
    this._composerUI.render();

    this.setVisible(initalValues, [shapes, plane, boundingBox]);
    this._composer.render();

    this.setVisible(initalValues, [shapes, UI, plane, boundingBox]);
  }
}
