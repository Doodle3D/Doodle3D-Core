import * as THREE from 'three';
import { shapeToPoints } from '../shape/shapeToPoints.js';
import { getPointsBounds } from '../shape/shapeDataUtils.js';
import { Vector } from '@doodle3d/cal';
import arrayMemoizer from './arrayMemoizer.js';
import memoize from 'memoizee';
// import createDebug from 'debug';
// const debug = createDebug('d3d:util:selection');

// Memoized selector that returns the same array of shapeData's when
// - the selection array didn't change
// - the objects in the resulting array didn't change
// enables memoization of utils that use this array
export const getSelectedObjectsSelector = arrayMemoizer(getSelectedObjects);
// export const getSelectedObjectsSelector = getSelectedObjects;
function getSelectedObjects(selectedObjects, objectsById) {
  return selectedObjects.map(({ id }) => objectsById[id]);
}

/*
 * Get the boundingbox of (multiple) shape data's
 * This generally can by two types of boundingboxes.
 * 1) The boundingbox of the shapes without the selection transformations (rotation, scale etc).
 *    Requires a selectionTransform matrix.
 *    This is used to display the transformations that are applied to a selection,
 *    showing a for example rotated boundingbox.
 *    Views like the 2D SelectionView will place it over the selection
 *    by applying the selection transformations (translating it to Objects Container Space).
 * 2) The boundingbox of the shapes with the selection transformations.
 *    This is used to get the axis-aligned bounding box of shapes, this is
 *    usually used to contain the shapes within the drawing area.
 */
export const getBoundingBox = memoize(getBoundingBoxRaw, { max: 1 });
// export const getBoundingBox = getBoundingBoxRaw;
function getBoundingBoxRaw(shapeDatas, selectionTransform) {
  if (selectionTransform !== undefined) {
    // To show a rectangle / box around the selection that has the
    // selection transforms (rotation, scale) of the selection we first have to
    // remove the selection transforms so we can get the boundingbox of
    // all the selected shapes as if they where not transformed yet.
    // We do this by multiplying it by the inverse of the selection transforms.
    // In the case of one shape the selection transforms equals it's own
    // transform, but in the case of multiple shapes this only contains the
    // transformations since the last selection change.
    const selectionTransformInverse = selectionTransform.inverseMatrix();
    shapeDatas = shapeDatas.map(shapeData => ({
      ...shapeData,
      transform: shapeData.transform.multiplyMatrix(selectionTransformInverse)
    }));
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const shapeData of shapeDatas) {
    const compoundPath = shapeToPoints(shapeData);
    const { min, max } = getPointsBounds(compoundPath, shapeData.transform);
    minX = (min.x < minX) ? min.x : minX;
    minY = (min.y < minY) ? min.y : minY;
    maxX = (max.x > maxX) ? max.x : maxX;
    maxY = (max.y > maxY) ? max.y : maxY;

    const { z, height } = shapeData;
    minZ = (z < minZ) ? z : minZ;
    maxZ = (z + height > maxZ) ? z + height : maxZ;
  }

  const min = new THREE.Vector3(minX, minZ, minY);
  const max = new THREE.Vector3(maxX, maxZ, maxY);
  const center = new Vector(minX, minY).add(new Vector(maxX, maxY)).scale(0.5);

  return { min, max, center };
}
