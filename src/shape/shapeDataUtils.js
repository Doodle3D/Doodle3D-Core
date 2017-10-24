import memoize from 'memoizee';
import { Vector } from '@doodle3d/cal';

export function shapeChanged(oldShapeData, newShapeData) {
  const pointsChanged = oldShapeData.points !== newShapeData.points;
  const holesChanged = oldShapeData.holes !== newShapeData.holes;
  const rectSizeChanged = oldShapeData.rectSize !== newShapeData.rectSize;
  const triangleSizeChanged = oldShapeData.triangleSize !== newShapeData.triangleSize;
  const circleChanged = oldShapeData.circle !== newShapeData.circle;
  const starChanged = oldShapeData.star !== newShapeData.star;
  const textChanged = oldShapeData.text !== newShapeData.text;
  const polyPoints = oldShapeData.polyPoints !== newShapeData.polyPoints;
  const fillChanged = oldShapeData.fill !== newShapeData.fill;
  const heartChanged = oldShapeData.heart !== newShapeData.heart;

  return pointsChanged || holesChanged || rectSizeChanged || triangleSizeChanged ||
    circleChanged || starChanged || textChanged || polyPoints || fillChanged || heartChanged;
}

// TODO use actual const
const SHAPE_CACHE_LIMIT = 10;


export const getPointsBounds = memoize(getPointsBoundsRaw, { max: SHAPE_CACHE_LIMIT });
export function getPointsBoundsRaw(compoundPaths, transform) {
  let points = compoundPaths.reduce((a, { points: b }) => a.concat(b), []);

  if (transform !== undefined) {
    points = applyMatrixOnPath(points, transform);
  }

  const min = new Vector(
    Math.min(...points.map((point) => point.x)),
    Math.min(...points.map((point) => point.y))
  );
  const max = new Vector(
    Math.max(...points.map((point) => point.x)),
    Math.max(...points.map((point) => point.y))
  );

  return { min, max };
}

export function getPointsCenter(points) {
  const { min, max } = getPointsBounds(points);
  return min.add(max).scale(0.5);
}

export function isClosed(shapeData) {
  switch (shapeData.type) {
    case 'RECT':
    case 'TRIANGLE':
    case 'STAR':
    case 'CIRCLE':
    case 'CIRCLE_SEGMENT':
    case 'COMPOUND_PATH':
      return true;
    default:
      return false;
  }
}

export const shapeDataToShape = memoize(shapeDataToShapeRaw, { max: SHAPE_CACHE_LIMIT });
// export const shapeDataToShape = shapeDataToShapeRaw;
function shapeDataToShapeRaw(shapeData) {
  if (shapeData.type === 'IMAGE_GUIDE') {
    return new ImageShape(shapeData);
  } else {
    return new Shape(shapeData);
  }
}
