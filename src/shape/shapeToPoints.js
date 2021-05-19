import * as THREE from 'three';
import memoize from 'memoizee';
import { Vector } from '@doodle3d/cal';
import ClipperShape from '@doodle3d/clipper-js';
import { pathToVectorPath } from '../utils/vectorUtils.js';
import { CLIPPER_PRECISION } from '../constants/d2Constants.js';
import { MAX_ANGLE } from '../constants/d3Constants.js';
import { SHAPE_CACHE_LIMIT } from '../constants/general.js';
import { createText } from '../utils/textUtils.js';
import { segmentBezierPath } from '../utils/curveUtils.js';
import { TEXT_TOOL_FONT_SIZE } from '../constants/d2Constants.js';

const setDirection = (clockwise) => (path) => {
  return (THREE.ShapeUtils.isClockWise(path) === clockwise) ? path : path.reverse();
};
const setDirectionClockWise = setDirection(true);
const setDirectionCounterClockWise = setDirection(false);

const HEART_BEZIER_PATH = [
  new Vector(0.0, -0.5),
  new Vector(0.1, -1.1),
  new Vector(1.0, -1.1),
  new Vector(1.0, -0.4),
  new Vector(1.0, 0.3),
  new Vector(0.1, 0.5),
  new Vector(0.0, 1.0),
  new Vector(-0.1, 0.5),
  new Vector(-1.0, 0.3),
  new Vector(-1.0, -0.4),
  new Vector(-1.0, -1.1),
  new Vector(-0.1, -1.1),
  new Vector(0.0, -0.5)
];

export const shapeToPoints = memoize(shapeToPointsRaw, { max: SHAPE_CACHE_LIMIT });
function shapeToPointsRaw(shapeData) {
  const shapes = [];

  switch (shapeData.type) {
    case 'RECT': {
      const { rectSize } = shapeData;
      const points = [
        new Vector(0, 0),
        new Vector(rectSize.x, 0),
        new Vector(rectSize.x, rectSize.y),
        new Vector(0, rectSize.y),
        new Vector(0, 0)
      ];
      shapes.push({ points, holes: [] });
      break;
    }
    case 'TRIANGLE': {
      const { triangleSize } = shapeData;
      const points = [
        new Vector(0, 0),
        new Vector(triangleSize.x / 2, triangleSize.y),
        new Vector(-triangleSize.x / 2, triangleSize.y),
        new Vector(0, 0)
      ];
      shapes.push({ points, holes: [] });
      break;
    }
    case 'STAR': {
      const { rays, outerRadius, innerRadius } = shapeData.star;
      const points = [];
      let even = false;
      const numLines = rays * 2;
      for (let i = 0, rad = 0; i <= numLines; i ++, rad += Math.PI / rays, even = !even) {
        if (i === numLines) { // last line?
          points.push(points[0].clone()); // go to first point
        } else {
          const radius = even ? innerRadius : outerRadius;
          let x = Math.sin(rad) * radius;
          let y = -Math.cos(rad) * radius;
          points.push(new Vector(x, y));
        }
      }
      shapes.push({ points, holes: [] });
      break;
    }
    case 'CIRCLE':
    case 'CIRCLE_SEGMENT': {
      const { radius, segment } = shapeData.circle;
      const points = [];
      const circumference = 2 * radius * Math.PI;
      const numSegments = Math.max(3, Math.min(circumference * 2, 32));
      for (let rad = 0; rad < segment; rad += Math.PI * 2 / numSegments) {
        const x = Math.sin(rad) * radius;
        const y = -Math.cos(rad) * radius;
        points.push(new Vector(x, y));
      }
      if (segment < Math.PI * 2) {
        const x = Math.sin(segment) * radius;
        const y = -Math.cos(segment) * radius;

        points.push(
          new Vector(x, y),
          new Vector(0, 0),
          new Vector(0, -radius)
        );
      }
      if (shapeData.type === 'CIRCLE') {
        points.push(points[0].clone()); // go to first point
      }
      shapes.push({ points, holes: [] });
      break;
    }
    case 'IMAGE_GUIDE': {
      const { width, height } = shapeData.imageData;
      const maxX = width / 2;
      const maxY = height / 2;
      const points = [
        new Vector(-maxX, -maxY),
        new Vector(maxX, -maxY),
        new Vector(maxX, maxY),
        new Vector(-maxX, maxY)
      ];
      shapes.push({ points, holes: [] });
      break;
    }
    case 'TEXT': {
      const { text, family, style, weight } = shapeData.text;
      const textShapes = createText(text, TEXT_TOOL_FONT_SIZE, 10, family, style, weight)
        .map(([points, ...holes]) => ({ points, holes }));

      shapes.push(...textShapes);
      break;
    }
    case 'COMPOUND_PATH': {
      shapes.push({ points: shapeData.points, holes: shapeData.holes });
      break;
    }
    case 'EXPORT_SHAPE': {
      shapes.push(...shapeData.shapes);
      break;
    }
    case 'POLY_POINTS': {
      const { numPoints, radius } = shapeData.polyPoints;
      const points = [];
      for (let i = 0, rad = 0; i <= numPoints; i ++, rad += Math.PI * 2 / numPoints) {
        if (i === numPoints) { // last line?
          points.push(points[0].clone()); // go to first point
        } else {
          const x = Math.sin(rad) * radius;
          const y = -Math.cos(rad) * radius;
          points.push(new Vector(x, y));
        }
      }
      shapes.push({ points, holes: [] });
      break;
    }
    case 'HEART': {
      const { width, height } = shapeData.heart;
      const bezierPath = HEART_BEZIER_PATH
        .map(({ x, y }) => (new Vector(x * width, y * height)));
      const points = segmentBezierPath(bezierPath, 0.2);
      shapes.push({ points, holes: [] });
      break;
    }
    case 'BRUSH': {
      const [points, ...holes] = new ClipperShape([shapeData.points], false, true, false, false)
        .scaleUp(CLIPPER_PRECISION)
        .round().removeDuplicates()
        .offset(shapeData.strokeWidth * CLIPPER_PRECISION, {
          jointType: 'jtRound',
          endType: 'etOpenRound',
          miterLimit: 2.0,
          roundPrecision: 0.25
        })
        .scaleDown(CLIPPER_PRECISION)
        .mapToLower()
        .map(pathToVectorPath)
        .map(path => {
          path.push(path[0]);
          return path;
        });

      if (points) shapes.push({ points, holes });
      break;
    }

    case 'FREE_HAND':
    case 'POLYGON': {
      const { points = [], holes = [] } = shapeData;
      if (shapeData.fill) {
        new ClipperShape([points, ...holes], true, true, false, false)
          .simplify('pftEvenOdd')
          .separateShapes()
          .forEach(shape => {
            const [points, ...holes] = shape
              .mapToLower()
              .map(pathToVectorPath)
              .map(path => {
                path.push(path[0]);
                return path;
              });
            shapes.push({ points, holes });
          });
      } else {
        shapes.push({ points, holes });
      }

      break;
    }

    default:
      break;
  }

  // make sure all shapes are clockwise and all holes are counter-clockwise
  if (shapeData.fill) {
    for (const shape of shapes) {
      shape.points = setDirectionClockWise(shape.points);
      shape.holes = shape.holes.map(setDirectionCounterClockWise);
    }
  }

  return shapes;
}

export const shapeToPointsCornered = memoize(shapeToPointsCorneredRaw, { max: SHAPE_CACHE_LIMIT });
function shapeToPointsCorneredRaw(shapeData) {
  let shapes = shapeToPoints(shapeData);

  if (!shapeData.fill && !shapeData.solid) {
    const newShapes = [];
    for (const shape of shapes) {
      const { points } = shape;
      new ClipperShape([points], false, true, false, false)
        .scaleUp(CLIPPER_PRECISION)
        .round().removeDuplicates()
        .offset(CLIPPER_PRECISION, {
          jointType: 'jtSquare',
          endType: 'etOpenSquare',
          miterLimit: 2.0,
          roundPrecision: 0.25
        })
        .scaleDown(CLIPPER_PRECISION)
        .separateShapes()
        .forEach(shape => {
          let [points, ...holes] = shape
            .mapToLower()
            .map(pathToVectorPath)
            .map(path => {
              path.push(path[0]);
              return path;
            });

          points = setDirectionClockWise(points);
          holes = holes.map(setDirectionCounterClockWise);

          newShapes.push({ points, holes });
        });
    }
    shapes = newShapes;
  }

  return shapes.map(({ points: oldPoints, holes: oldHoles }) => {
    const { path: points, map: pointsMap } = addCorners(oldPoints);
    const { paths: holes, maps: holesMaps } = oldHoles
      .map(hole => addCorners(hole))
      .reduce((previous, { path, map }) => {
        previous.paths.push(path);
        previous.maps.push(map);

        return previous;
      }, { paths: [], maps: [] });
    return { points, holes, pointsMap, holesMaps };
  });
}

// Adds point when angle between points is larger then MAX_ANGLE
const maxAngleRad = (MAX_ANGLE / 360) * (2 * Math.PI);
function addCorners(oldPath) {
  const normals = [];
  for (let i = 1; i < oldPath.length; i ++) {
    const pointA = oldPath[i - 1];
    const pointB = oldPath[i];

    const normal = pointB.subtract(pointA).normalize();

    normals.push(normal);
  }

  const map = [0];
  const path = [oldPath[0]];
  for (let i = 1, length = oldPath.length - 1; i < length; i ++) {
    const point = oldPath[i];

    const normalA = normals[i - 1];
    const normalB = normals[i];

    const angle = Math.acos(normalA.dot(normalB));

    if (angle > maxAngleRad) {
      path.push(new Vector().copy(point));
    }
    path.push(point);

    map.push(path.length - 1);
  }
  path.push(oldPath[oldPath.length - 1]);

  return { path, map };
}
