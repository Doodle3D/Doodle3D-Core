import * as THREE from 'three';
import OutlinePass from './OutlinePass.js';
import RenderPass from './RenderPass.js';
import 'three/examples/js/shaders/CopyShader.js';
import 'three/examples/js/postprocessing/EffectComposer.js';
import 'three/examples/js/postprocessing/ShaderPass.js';

export default class RenderChain extends THREE.EffectComposer {
  constructor(renderer, scene, camera, toonShader, groups) {
    super(renderer);
    this._groups = groups;

    if (toonShader) {
      const renderPass = new RenderPass(scene, camera, () => {
        this._setVisible(this._initalValues, [groups.shapes, groups.plane, groups.boundingBox]);
      });
      this.addPass(renderPass);

      const outlinePass = new OutlinePass(scene, camera, () => {
        this._setVisible(this._initalValues, [groups.shapes]);
      });
      outlinePass.renderToScreen = true;
      this.addPass(outlinePass);

      const renderPassUI = new RenderPass(scene, camera, () => {
        this._setVisible(this._initalValues, [groups.UI]);
      });
      renderPassUI.clear = false;
      renderPassUI.renderToScreen = true;
      this.addPass(renderPassUI);
    } else {
      const renderPass = new RenderPass(scene, camera);
      renderPass.renderToScreen = true;
      this.addPass(renderPass);
    }

    this._renderer = renderer;
    this._camera = camera;
    this._scene = scene;
    this._toonShader = toonShader;
  }

  _getCurrentVisibleValues() {
    const visibleValues = {};

    for (const key in this._groups) {
      visibleValues[key] = this._groups[key].visible;
    }

    return visibleValues;
  }

  _setVisible(initalValues, visibleGroups) {
    for (const key in this._groups) {
      const group = this._groups[key];

      if (visibleGroups.indexOf(group) !== -1) {
        group.visible = initalValues[key];
      } else {
        group.visible = false;
      }
    }
  }

  setSize(width, height, pixelRatio, render = true) {
    this._renderer.setPixelRatio(pixelRatio);
    this._renderer.setSize(width, height);
    super.setSize(width * pixelRatio, height * pixelRatio);

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    if (render) this.render();
  }

  render() {
    if (this._toonShader) {
      this._initalValues = this._getCurrentVisibleValues();
    }

    super.render();

    if (this._toonShader) {
      const { shapes, UI, plane, boundingBox } = this._groups;
      this._setVisible(this._initalValues, [shapes, UI, plane, boundingBox]);
    }
  }
}
