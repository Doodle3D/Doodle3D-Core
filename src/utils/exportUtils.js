import { Matrix } from '@doodle3d/cal';
import * as exportSTL from '@doodle3d/threejs-export-stl';
import * as exportOBJ from '@doodle3d/threejs-export-obj';
import * as THREE from 'three';
import ThreeBSP from 'three-js-csg';
import ClipperShape from '@doodle3d/clipper-js';
import ShapeMesh from '../d3/ShapeMesh.js';
import { applyMatrixOnShape, pathToVectorPath } from '../utils/vectorUtils.js';
import { shapeToPoints } from '../shape/shapeToPoints.js';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import { LINE_WIDTH } from '../constants/exportConstants.js';
import { bufferToBase64 } from '../utils/binaryUtils.js';

const THREE_BSP = ThreeBSP(THREE);

// Causes y and z coord to flip so z is up
const ROTATION_MATRIX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const SCALE = 10.0;

function createExportGeometry(shapeData, offsetSingleWalls, lineWidth) {
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

  const objectMesh = new ShapeMesh({
    ...shapeData,
    transform: new Matrix(),
    type: 'EXPORT_SHAPE',
    fill,
    shapes
  });

  return objectMesh;
}

export function generateExportMesh(state, options = {}) {
  const {
    experimentalColorUnionExport = false,
    exportLineWidth = LINE_WIDTH,
    offsetSingleWalls = true,
    matrix = ROTATION_MATRIX
  } = options;

  const geometries = [];
  const materials = [];
  for (const id in state.objectsById) {
    const shapeData = state.objectsById[id];

    if (!SHAPE_TYPE_PROPERTIES[shapeData.type].D3Visible) continue;

    const { geometry, material } = createExportGeometry(shapeData, offsetSingleWalls, exportLineWidth);
    let objectGeometry = new THREE.Geometry().fromBufferGeometry(geometry);
    objectGeometry.mergeVertices();
    objectGeometry.applyMatrix(state.spaces[shapeData.space].matrix);

    if (experimentalColorUnionExport) objectGeometry = new THREE_BSP(objectGeometry);

    const colorHex = material.color.getHex();
    const index = materials.findIndex(exportMaterial => exportMaterial.color.getHex() === colorHex);
    if (index !== -1) {
      if (experimentalColorUnionExport) {
        geometries[index] = geometries[index].union(objectGeometry);
      } else {
        geometries[index].merge(objectGeometry);
      }
    } else {
      geometries.push(objectGeometry);
      materials.push(material);
    }
  }

  const exportGeometry = geometries.reduce((combinedGeometry, geometry, materialIndex) => {
    if (experimentalColorUnionExport) geometry = geometry.toMesh().geometry;
    combinedGeometry.merge(geometry, matrix, materialIndex);
    return combinedGeometry;
  }, new THREE.Geometry());
  const exportMaterial = new THREE.MultiMaterial(materials);

  return new THREE.Mesh(exportGeometry, exportMaterial);
}

export async function createFile(objectsById, type, options) {
  const exportMesh = generateExportMesh(objectsById, options);

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
      return new Blob([buffer], { type: 'application/vnd.ms-pki.stl' })
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
