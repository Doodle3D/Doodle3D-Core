import fitCurve from 'fit-curve';
import Bezier from 'bezier-js';
import { Vector } from '@doodle3d/cal';

const DEFAULT_CURVE_ERROR = 3.0;
const DEFAULT_DISTANCE_THRESHOLD = 1.0;

export function fitPath(path, curveError = DEFAULT_CURVE_ERROR) {
  if (!path || path.length === 0) throw new Error('Path contains no points in fitPath');
  const first = path[0].clone(); // store first point so it can be used in reduce function
  path = path.map(({ x, y }) => [x, y]); // convert path to [...[x, y]] format
  return fitCurve(path, curveError)
    .reduce((bezierPath, [ // convert to [...Vector] format. n+0 is path point, n+1 and n+2 are control points
      start,
      [controlPoint1X, controlPoint1Y],
      [controlPoint2X, controlPoint2Y],
      [endX, endY]
    ]) => {
      bezierPath.push(
        new Vector(controlPoint1X, controlPoint1Y),
        new Vector(controlPoint2X, controlPoint2Y),
        new Vector(endX, endY)
      );

      return bezierPath;
    }, [first]);  // always add first point
}

export function segmentBezierPath(bezierPath, distanceThreshold = DEFAULT_DISTANCE_THRESHOLD) {
  const path = [];
  for (let i = 0; i < bezierPath.length - 3; i += 3) {
    const bezierCurve = new Bezier(
      bezierPath[i].x, bezierPath[i].y,
      bezierPath[i + 1].x, bezierPath[i + 1].y,
      bezierPath[i + 2].x, bezierPath[i + 2].y,
      bezierPath[i + 3].x, bezierPath[i + 3].y
    );
    path.push(...recursiveBezierSegmenter(distanceThreshold, bezierCurve));
  }
  path.push(new Vector().copy(bezierPath[bezierPath.length - 1]));
  return path;
}

function recursiveBezierSegmenter(
  distanceThreshold, bezierCurve,
  tStart = 0.0, tEnd = 1.0,
  pStart = new Vector().copy(bezierCurve.get(tStart)), pEnd = new Vector().copy(bezierCurve.get(tEnd))
) {
  const tCenter = (tStart + tEnd) * 0.5;
  const pCenter = new Vector().copy(bezierCurve.get(tCenter));

  const distance = Math.abs(pEnd.subtract(pStart).normal().normalize().dot(pCenter.subtract(pStart)));

  if (distance > distanceThreshold) {
    const segmentStart = recursiveBezierSegmenter(
      distanceThreshold, bezierCurve,
      tStart, tCenter,
      pStart, pCenter
    );
    const segmentEnd = recursiveBezierSegmenter(
      distanceThreshold, bezierCurve,
      tCenter, tEnd,
      pCenter, pEnd
    );

    return segmentStart.concat(segmentEnd);
  } else {
    return [pStart];
  }
}
