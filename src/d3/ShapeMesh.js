import { Vector } from '@doodle3d/cal';
import { applyMatrixOnPath } from '../utils/vectorUtils.js';
import { shapeToPointsCornered } from '../shape/shapeToPoints.js';
import * as THREE from 'three';
import { getPointsBounds, shapeChanged } from '../shape/shapeDataUtils.js';
// import { DESELECT_TRANSPARENCY, LEGACY_HEIGHT_STEP, LEGACY_HEIGHT_STEP } from '../js/constants/d3Constants.js';

const MAX_HEIGHT_BASE = 5;
// Legacy compensation. Compensating for the fact that we
// used to devide the twist by the fixed sculpt steps.
// TODO: move this to twist factor in interface
// and converting old files on open once
const isValidNumber = (num) => typeof num === 'number' && !isNaN(num);

class ShapeMesh extends THREE.Mesh {
  constructor(shapeData, toonShader) {
    const { sculpt, rotate, twist, height, type, transform, z, color, fill } = shapeData;

    let material;
    if (toonShader) {
      material = new THREE.MeshToonMaterial({
        color: new THREE.Color(color),
        shading: THREE.SmoothShading,
        side: THREE.DoubleSide
      });
    } else {
      material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide
      });
    }

    super(new THREE.BufferGeometry(), material);

    this._toonShader = toonShader;

    this.name = shapeData.UID;

    this._shapes = [];
    this._shapesMap = [];

    this._center = new Vector();

    this._sculpt = sculpt;
    this._rotate = rotate;
    this._twist = twist;
    this._height = height;
    this._type = type;
    this._transform = transform;
    this._z = z;
    this._shapeData = shapeData;
    this._color = color;
    this._fill = fill;

    this.updatePoints(shapeData);
  }

  update(shapeData) {
    let changed = false;

    if (shapeChanged(this._shapeData, shapeData)) {
      this.updatePoints(shapeData);
      changed = true;
    }

    if (shapeData.transform !== this._transform || shapeData.z !== this._z) {
      this.updateTransform(shapeData.transform, shapeData.z);
      changed = true;
    }

    if (shapeData.height !== this._height) {
      this.updateHeight(shapeData.height);
      changed = true;
    }

    if (shapeData.sculpt !== this._sculpt) {
      this.updateSculpt(shapeData.sculpt);
      changed = true;
    }

    if (shapeData.twist !== this._twist) {
      this.updateTwist(shapeData.twist);
      changed = true;
    }

    if (shapeData.color !== this._color) {
      this.updateColor(shapeData.color);
      changed = true;
    }

    this._shapeData = shapeData;
    return changed;
  }

  setOpaque(opaque) {
    this.material.opacity = opaque ? 1.0 : 1.0 - DESELECT_TRANSPARENCY;
    this.material.transparent = !opaque;
  }

  dispose() {
    this.geometry.dispose();
  }

  updatePoints(shapeData) {
    this._fill = shapeData.fill;
    this._points = shapeData.points;
    this._rectSize = shapeData.rectSize;
    this._circle = shapeData.circle;
    this._star = shapeData.star;
    this._triangleSize = shapeData.triangleSize;

    const compoundPaths = shapeToPointsCornered(shapeData);
    this._shapes = compoundPaths.map(({ points, holes = [], pointsMap, holesMaps = [] }) => ({
      shape: [points, ...holes],
      maps: [pointsMap, ...holesMaps]
    }));

    const { min, max } = getPointsBounds(compoundPaths);
    this._center.copy(min.add(max).scale(0.5));

    if (!this._heightSteps) {
      this._updateSide();
    } else {
      this._updateFaces();
    }
    this._updateVertices();
  }

  updateSculpt(sculpt) {
    if (!sculpt.every(({ pos, scale }) => isValidNumber(pos) && isValidNumber(scale))) {
      throw new Error(`Cannot update object ${this.name}: sculpt contains invalid values.`);
    }

    this._sculpt = sculpt;
    this._updateSide();
    this._updateVertices();
  }

  updateTwist(twist) {
    if (!isValidNumber(twist)) {
      throw new Error(`Cannot update object ${this.name}: twist is an invalid value.`);
    }

    this._twist = twist;
    this._updateSide();
    this._updateVertices();
  }

  updateHeight(height) {
    if (!isValidNumber(height)) {
      throw new Error(`Cannot update object ${this.name}: height is an invalid value.`);
    }

    this._height = height;
    this._updateSide();
    this._updateVertices();
  }

  updateTransform(transform, z) {
    // TODO
    // transform.matrix.every could improved performance wise
    if (!transform.matrix.every(isValidNumber)) {
      throw new Error(`Cannot update object ${this.name}: transform contains invalid values.`);
    }

    this._transform = transform;
    this._z = z;
    this._updateVertices();
  }

  updateColor(color) {
    if (!isValidNumber(color)) {
      throw new Error(`Cannot update object ${this.name}: color is an invalid value.`);
    }

    this.material.color.setHex(color);
    this._color = color;
  }

  _getPoint(point, heightStep, center) {
    const { scale, pos: y } = this._heightSteps[heightStep];

    if (scale !== 1 || (this._twist !== 0 && heightStep !== 0)) {
      point = point.subtract(center);

      if (scale !== 1) {
        point = point.scale(scale);
      }
      if (this._twist !== 0 && heightStep !== 0) {
        point = point.rotate(this._twist * y / LEGACY_HEIGHT_STEP);
      }

      point = point.add(center);
    }

    return { x: point.x, y: y + this._z, z: point.y };
  }
  _updateVerticesHorizontal(heightStep, paths, center, indexCounter) {
    for (let pathindex = 0; pathindex < paths.length; pathindex ++) {
      const path = applyMatrixOnPath(paths[pathindex], this._transform);

      for (let pathIndex = 0; pathIndex < path.length; pathIndex ++) {
        let point = path[pathIndex];

        const { x, y, z } = this._getPoint(point, heightStep, center);

        this._vertices[indexCounter ++] = x;
        this._vertices[indexCounter ++] = y;
        this._vertices[indexCounter ++] = z;
      }
    }

    return indexCounter;
  }
  _updateVertices() {
    const numHeightSteps = this._heightSteps.length;
    const center = this._center.applyMatrix(this._transform);

    let indexCounter = 0;

    for (let i = 0; i < this._shapes.length; i ++) {
      const paths = this._shapes[i].shape;

      if (this._fill) {
        // update positions of bottom vertices
        indexCounter = this._updateVerticesHorizontal(0, paths, center, indexCounter);
        // update positions of top vertices
        indexCounter = this._updateVerticesHorizontal(numHeightSteps - 1, paths, center, indexCounter);
      }

      for (let pathsIndex = 0; pathsIndex < paths.length; pathsIndex ++) {
        const path = applyMatrixOnPath(paths[pathsIndex], this._transform);

        for (let pathIndex = 0; pathIndex < path.length; pathIndex ++) {
          let point = path[pathIndex];

          for (let heightStep = 0; heightStep < numHeightSteps; heightStep ++) {
            const { x, y, z } = this._getPoint(point, heightStep, center);

            this._vertices[indexCounter ++] = x;
            this._vertices[indexCounter ++] = y;
            this._vertices[indexCounter ++] = z;
          }
        }
      }
    }

    this._vertexBuffer.needsUpdate = true;

    this.geometry.boundingBox = null;
    this.geometry.boundingSphere = null;
    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
  }
  _updateSide() {
    // TODO use higher precision for export mesh
    const maxHeight = MAX_HEIGHT_BASE / Math.abs(this._twist);

    const heightSteps = this._sculpt
      .map(({ scale, pos }) => ({
        pos: pos * this._height,
        scale
      }))
      .reduce((_heightSteps, currentStep, i, sculptSteps) => {
        _heightSteps.push(currentStep);

        if (sculptSteps.length === 1 + i) return _heightSteps;

        const nextStep = sculptSteps[i + 1];

        const heightDifference = nextStep.pos - currentStep.pos;
        const intermediateSteps = Math.floor(heightDifference / maxHeight);
        const intermediateStepHeight = heightDifference / intermediateSteps;
        const intermediateStepScale = (nextStep.scale - currentStep.scale) / intermediateSteps;

        for (let j = 1; j < intermediateSteps; j ++) {
          _heightSteps.push({
            pos: currentStep.pos + intermediateStepHeight * j,
            scale: currentStep.scale + intermediateStepScale * j
          });
        }

        return _heightSteps;
      }, []);

    const heightStepsChanged = !this._heightSteps || heightSteps.length !== this._heightSteps.length;
    this._heightSteps = heightSteps;

    if (heightStepsChanged) this._updateFaces();
  }
  _updateFaces() {
    // TODO
    // find better way to update indexBuffer
    // seems bit redicules to remove the whole geometry to update indexes

    const numHeightSteps = this._heightSteps.length;

    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry();

    // store total number of indexes and vertices needed
    let indexBufferLength = 0;
    let vertexBufferLength = 0;

    // store triangulated indexes for top and bottom per shape
    const triangulatedIndexes = [];
    const vertexOffsets = [];

    for (let i = 0; i < this._shapes.length; i ++) {
      const { shape, maps } = this._shapes[i];

      // shape structure is [...[...Vector]]
      // map to [...Int]
      // sum all values to get total number of points
      const numPoints = shape
        .map(({ length }) => length)
        .reduce((a, b) => a + b, 0);

      const vertexOffset = vertexBufferLength / 3;

      if (this._fill) {
        let offset = 0;
        const flatMap = maps
          // further flattening each shape's maps;
          // [pointsMap, ...holesMaps] to one flat array.
          .map((map, j) => {
            map = map.map(value => value + offset);
            offset += shape[j].length;
            return map;
          })
          // because maps indexes point to points,
          // update each map to be offsetted by the total number of previous points
          .reduce((a, b) => a.concat(b), []);

        const [points, ...holes] = maps
          .map((map, j) => {
            const path = shape[j];
            return map.map(k => path[k]);
          })
          .map(path => path.map(({ x, y }) => new THREE.Vector2(x, y)));

        // triangulate
        const triangulatedBottom = THREE.ShapeUtils.triangulateShape(points, holes)
          .reduce((a, b) => a.concat(b), [])
          // // map mapped indexes back to original indexes
          .map(value => flatMap[value])
          .map(value => value + vertexOffset);
        // reverse index order for bottom so faces are flipped
        const triangulatedTop = triangulatedBottom
          .map(value => value + numPoints)
          .reverse();

        triangulatedIndexes.push(triangulatedBottom.concat(triangulatedTop));

        indexBufferLength += triangulatedBottom.length + triangulatedTop.length;
        vertexBufferLength += numPoints * 6;
        vertexOffsets.push(vertexOffset + numPoints * 2);
      } else {
        vertexOffsets.push(vertexOffset);
      }

      // calculate the number of indexes (faces) needed for the outside wall
      indexBufferLength += (numPoints - 1) * (numHeightSteps - 1) * 6;
      // number of vertices needed for the outside wall is
      // (the total number of points in the shape) *
      // (the number of height steps + 1) *
      // (the number of dimensions, 3)
      vertexBufferLength += numPoints * numHeightSteps * 3;
    }

    const indexes = new Uint32Array(indexBufferLength);
    const indexBuffer = new THREE.BufferAttribute(indexes, 1);
    this.geometry.setIndex(indexBuffer);

    let indexCounter = 0;
    for (let i = 0; i < this._shapes.length; i ++) {
      const { shape } = this._shapes[i];

      if (this._fill) {
        for (let j = 0; j < triangulatedIndexes[i].length; j ++) {
          indexes[indexCounter ++] = triangulatedIndexes[i][j];
        }
      }

      let pointIndexOffset = 0;
      for (let shapeIndex = 0; shapeIndex < shape.length; shapeIndex ++) {
        const shapePart = shape[shapeIndex];

        for (let pointIndex = 0; pointIndex < shapePart.length - 1; pointIndex ++) {
          let base = (pointIndexOffset + pointIndex) * numHeightSteps + vertexOffsets[i];

          for (let heightStep = 0; heightStep < (numHeightSteps - 1); heightStep ++) {
            indexes[indexCounter ++] = base;
            indexes[indexCounter ++] = base + numHeightSteps;
            indexes[indexCounter ++] = base + 1;

            indexes[indexCounter ++] = base + 1;
            indexes[indexCounter ++] = base + numHeightSteps;
            indexes[indexCounter ++] = base + numHeightSteps + 1;

            base ++;
          }
        }
        pointIndexOffset += shapePart.length;
      }
    }

    this._vertices = new Float32Array(vertexBufferLength);
    this._vertexBuffer = new THREE.BufferAttribute(this._vertices, 3);
    this.geometry.addAttribute('position', this._vertexBuffer);
  }
}

export default ShapeMesh;
