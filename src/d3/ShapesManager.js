import { determineActiveShape3d } from '../shape/shapeDataUtils.js';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import * as THREE from 'three';
import ShapeMesh from './ShapeMesh.js';
import ThreeBSP from 'three-js-csg';

const THREE_BSP = ThreeBSP(THREE);

export default class ShapesManager extends THREE.Object3D {
  constructor() {
    super();

    this._meshes = {};
    this._spaces = {};
    this.name = 'shapes-manager';

    this._holes = [];

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

    let holesChanged = false;

    // Remove removed shapes
    if (this._state) {
      for (const id in this._state.objectsById) {
        if (!state.objectsById[id]) {
          if (!this._state.objectsById[id].solid) holesChanged = true;
          this._handleShapeRemove(id);
          render = true;
        }
      }
    }

    const ids = Object.keys(state.objectsById);
    const activeShapes = determineActiveShape3d(state);

    for (let i = 0; i < ids.length; i ++) {
      const id = ids[i];
      const newShapeData = state.objectsById[id];
      const active = activeShapes[id];

      if (!SHAPE_TYPE_PROPERTIES[newShapeData.type].D3Visible) continue;
      // add new shapes
      if (!this._state || !this._state.objectsById[id]) {
        this._handleShapeAdded(newShapeData, active);
        render = true;
        if (!newShapeData.solid) holesChanged = true;
      } else {
        const { mesh } = this._meshes[id];
        if (mesh.update(newShapeData, active)) {
          render = true;
          if (!newShapeData.solid || !this._state.objectsById[id].solid) holesChanged = true;
        }
      }
    }

    if (holesChanged) {
      this._holes = [];
      for (let i = 0; i < ids.length; i ++) {
        const id = ids[i];
        if (activeShapes[id]) continue;

        const { solid, type } = state.objectsById[id];
        const d3Visible = SHAPE_TYPE_PROPERTIES[type].D3Visible;
        if (solid || !d3Visible) continue;

        const holeMesh = this._meshes[id].mesh._mesh;
        const geometry = new THREE.Geometry().fromBufferGeometry(holeMesh.geometry);
        if (geometry.vertices.length === 0) continue;

        const box = new THREE.Box3().setFromPoints(geometry.vertices);
        const intersectHole = this._holes.find(hole => hole.box.intersectsBox(box));

        const bsp = new THREE_BSP(geometry);

        if (intersectHole) {
          intersectHole.bsp = intersectHole.bsp.union(bsp);
          const min = box.min.min(intersectHole.box.min);
          const max = box.max.max(intersectHole.box.max);
          intersectHole.box = new THREE.Box3(min, max);
        } else {
          this._holes.push({ bsp, box });
        }
        geometry.dispose();
      }
    }

    for (let i = 0; i < ids.length; i ++) {
      const id = ids[i];
      const active = activeShapes[id];
      const { solid, type } = state.objectsById[id];
      const d3Visible = SHAPE_TYPE_PROPERTIES[type].D3Visible;
      if (!active && solid && d3Visible) {
        const shape = this._meshes[id].mesh;
        if (shape.updateHoleGeometry(this._holes)) render = true;
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

  _handleShapeRemove(id) {
    if (this._meshes[id] === undefined) return;
    const { mesh, space } = this._meshes[id];
    mesh.dispose();
    delete this._meshes[id];

    this._spaces[space].remove(mesh);
  }

  _handleShapeAdded(shapeData, active) {
    if (!SHAPE_TYPE_PROPERTIES[shapeData.type].D3Visible) return;
    const { space } = shapeData;
    const mesh = new ShapeMesh(shapeData, active);
    this._meshes[shapeData.UID] = { mesh, space };

    this._spaces[space].add(mesh);
    //
    // const edges = new THREE.VertexNormalsHelper(mesh, 10, 0x000000, 3);
    // this._edges[shapeData.UID] = edges;
    //
    // this.add(edges);
  }
}
