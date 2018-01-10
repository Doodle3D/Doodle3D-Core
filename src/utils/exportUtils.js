import { Matrix } from '@doodle3d/cal';
import * as exportSTL from '@doodle3d/threejs-export-stl';
import * as exportOBJ from '@doodle3d/threejs-export-obj';
import * as THREE from 'three';
import ThreeBSP from 'three-js-csg';
import ClipperShape from '@doodle3d/clipper-js';
import ShapesManager from '../d3/ShapesManager.js';
import { applyMatrixOnShape, pathToVectorPath } from '../utils/vectorUtils.js';
import { shapeToPoints } from '../shape/shapeToPoints.js';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import { LINE_WIDTH } from '../constants/exportConstants.js';
import { bufferToBase64 } from '../utils/binaryUtils.js';

const THREE_BSP = ThreeBSP(THREE);

// Causes y and z coord to flip so z is up
const ROTATION_MATRIX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const SCALE = 10.0;

function createExportShapeData(shapeData, offsetSingleWalls, lineWidth) {
  let shapes = shapeToPoints(shapeData).map(({ points, holes }) => {
    const shape = applyMatrixOnShape([points, ...holes], shapeData.transform);
    return new ClipperShape(shape, shapeData.fill, true, false);
  });

  if (shapeData.fill) {
    shapes = shapes.map(shape => shape
      .fixOrientation()
      .clean(0.01)
    );
  } else if (offsetSingleWalls) {
    shapes = shapes.map(shape => shape
      .scaleUp(SCALE)
      .round()
      .offset(lineWidth / 2 * SCALE, { jointType: 'jtSquare', endType: 'etOpenButt' })
      .simplify('pftNonZero')
      .scaleDown(SCALE)
    );
  }

  const fill = shapeData.fill || offsetSingleWalls;

  shapes = shapes
    .map(shape => shape
      .mapToLower()
      .map(pathToVectorPath)
    )
    .map(paths => paths.filter(path => path.length > 0))
    .filter(paths => paths.length > 0)
    .map(paths => paths.map(path => {
      if (fill) path.push(path[0].clone());
      return path;
    }))
    .map(([points, ...holes]) => ({ points, holes }));

  return {
    ...shapeData,
    transform: new Matrix(),
    type: 'EXPORT_SHAPE',
    originalFill: shapeData.fill,
    fill,
    shapes
  };
}

export function generateExportMesh(state, options = {}) {
  const {
    unionGeometry = false,
    lineWidth = LINE_WIDTH,
    offsetSingleWalls = true,
    matrix = ROTATION_MATRIX
  } = options;

  const exportState = {
    spaces: state.spaces,
    objectsById: {}
  };

  for (const id in state.objectsById) {
    const shapeData = state.objectsById[id];
    if (!SHAPE_TYPE_PROPERTIES[shapeData.type].D3Visible) continue;
    const exportShapeData = createExportShapeData(shapeData, offsetSingleWalls || unionGeometry, lineWidth);
    exportState.objectsById[id] = exportShapeData;
  }

  if (Object.keys(exportState.objectsById).length === 0) {
    throw new Error('sketch is empty');
  }

  const shapesManager = new ShapesManager({ toonShader: false });
  shapesManager.update(exportState);

  const materials = [];
  let exportGeometry;
  shapesManager.traverse(mesh => {
    const shapeData = exportState.objectsById[mesh.name];
    if (mesh instanceof THREE.Mesh && shapeData.solid) {
      const { geometry, material } = mesh;
      const objectMatrix = state.spaces[shapeData.space].matrix;

      let objectGeometry = geometry.clone();
      objectGeometry.mergeVertices();
      objectGeometry.applyMatrix(new THREE.Matrix4().multiplyMatrices(objectMatrix, matrix));

      const materialIndex = materials.length;
      const exportMaterial = new THREE.MeshBasicMaterial({ color: material.color.getHex() });
      exportMaterial.side = shapeData.fill ? THREE.FrontSide : THREE.DoubleSide;
      materials.push(exportMaterial);

      if (unionGeometry) {
        objectGeometry = new THREE_BSP(objectGeometry, materialIndex);
        if (exportGeometry) {
          exportGeometry = exportGeometry.union(objectGeometry);
        } else {
          exportGeometry = objectGeometry;
        }
      } else {
        if (!exportGeometry) exportGeometry = new THREE.Geometry();
        exportGeometry.merge(objectGeometry, undefined, materialIndex);
      }
    }
  });

  if (unionGeometry) {
    return exportGeometry.toMesh(materials);
  } else {
    return new THREE.Mesh(exportGeometry, materials);
  }
}

export async function createFile(state, type, options) {
  const exportMesh = generateExportMesh(state, options);

  switch (type) {
    case 'json-string': {
      const object = exportMesh.geometry.toJSON().data;
      const string = JSON.stringify(object);
      return string;
    }
    case 'json-blob': {
      const object = exportMesh.geometry.toJSON().data;
      const string = JSON.stringify(object);
      const blob = new Blob([string], { type: 'application/json' });
      return blob;
    }
    case 'stl-string': {
      const string = exportSTL.fromMesh(exportMesh, false);
      return string;
    }
    case 'stl-base64': {
      const buffer = exportSTL.fromMesh(exportMesh, true);
      return bufferToBase64(buffer);
    }
    case 'stl-blob': {
      const buffer = exportSTL.fromMesh(exportMesh, true);
      return new Blob([buffer], { type: 'application/vnd.ms-pki.stl' });
    }
    case 'obj-blob': {
      const buffer = await exportOBJ.fromMesh(exportMesh);
      return buffer;
    }
    case 'obj-base64': {
      const buffer = await exportOBJ.fromMesh(exportMesh);
      const base64 = bufferToBase64(buffer);
      return base64;
    }
    default:
      throw new Error(`did not regonize type ${type}`);
  }
}
