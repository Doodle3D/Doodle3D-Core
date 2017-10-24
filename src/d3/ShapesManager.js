import { SHAPE_TYPE_PROPERTIES } from '../shape/shapeTypeProperties.js';
import * as THREE from 'three';
import ShapeMesh from './ShapeMesh.js';

export default class ShapesManager extends THREE.Object3D {
  constructor({ toonShader }) {
    super();

    this._toonShader = toonShader;

    this._meshes = {};
    this._spaces = {};
    this.name = 'shapes-manager';
    // this._edges = {};
  }

  update(state) { // retruns a bool, indicating if a rerender is required
    let render = false;
    if (this._state === state) return render;

    for (const spaceId in state.spaces) {
      if (!this._spaces[spaceId]) {
        const space = state.spaces[spaceId];

        const container = new THREE.Object3D();
        container.matrixAutoUpdate = false;
        container.matrix.copy(space.matrix);

        this._spaces[spaceId] = container;
        this.add(container);
      } else if (this._spaces[spaceId] !== state.spaces[spaceId]) {
        const container = this._spaces[spaceId];
        const space = state.spaces[spaceId];
        container.matrix.copy(space.matrix);
      }
    }

    // Remove removed shapes
    if (this._state) {
      for (const id in this._state.objectsById) {
        if (!state.objectsById[id]) {
          this._handleShapeRemove(id);
          render = true;
        }
      }
    }

    for (const id in state.objectsById) {
      // const shapeData = this._state.objectsById[id];
      const newShapeData = state.objectsById[id];

      if (!SHAPE_TYPE_PROPERTIES[newShapeData.type].D3Visible) continue;
      // add new shapes
      if (!this._state || !this._state.objectsById[id]) {
        this._handleShapeAdded(newShapeData);
        render = true;
      } else {
        const { mesh } = this._meshes[id];
        if (mesh.update(newShapeData)) {
          render = true;
        }
      }
    }

    this._state = state;

    return render;
  }

  updateTransparent(selectedUIDs) {
    for (const UID in this._meshes) {
      const { mesh } = this._meshes[UID];
      const selected = selectedUIDs.indexOf(UID) !== -1;
      const opaque = selected || selectedUIDs.length === 0;

      mesh.setOpaque(opaque);
    }
  }

  getMesh(id) {
    return this._meshes[id].mesh;
  }

  _handleShapeRemove(id) {
    if (this._meshes[id] === undefined) return;
    const { mesh, space } = this._meshes[id];
    mesh.dispose();
    delete this._meshes[id];

    this._spaces[space].remove(mesh);
  }

  _handleShapeAdded(shapeData) {
    if (!SHAPE_TYPE_PROPERTIES[shapeData.type].D3Visible) return;
    const { space } = shapeData;
    const mesh = new ShapeMesh(shapeData, this._toonShader);
    this._meshes[shapeData.UID] = { mesh, space };

    this._spaces[space].add(mesh);
    //
    // const edges = new THREE.VertexNormalsHelper(mesh, 10, 0x000000, 3);
    // this._edges[shapeData.UID] = edges;
    //
    // this.add(edges);
  }
}
