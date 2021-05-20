import { Matrix, Vector } from '@doodle3d/cal';

export function calculateGestureMatrix(positions, previousPositions, screenMatrix, { rotate, scale, pan }) {
  const matrix = screenMatrix.inverseMatrix();
  const screenCenter = positions[0].add(positions[1]).scale(0.5).applyMatrix(matrix);

  let gestureMatrix = new Matrix();
  if (pan) {
    const previousCenter = previousPositions[0].add(previousPositions[1]).scale(0.5);
    const center = positions[0].add(positions[1]).scale(0.5);
    const gesturePan = center.subtract(previousCenter).applyMatrix(matrix.normalize());
    gestureMatrix = gestureMatrix.translate(gesturePan.x, gesturePan.y);
  }
  if (scale) {
    const previousLength = previousPositions[0].distanceTo(previousPositions[1]);
    const length = positions[0].distanceTo(positions[1]);
    const gestureScale = length / previousLength;
    gestureMatrix = gestureMatrix.scaleAroundAbsolute(gestureScale, gestureScale, screenCenter);
  }
  if (rotate) {
    const previousAngle = previousPositions[1].subtract(previousPositions[0]).angle();
    const angle = positions[1].subtract(positions[0]).angle();
    const gestureRotation = angle - previousAngle;
    gestureMatrix = gestureMatrix.rotateAroundAbsolute(gestureRotation, screenCenter);
  }

  return gestureMatrix;
}

export function decomposeMatrix(matrix) {
  const { sx, sy, x, y, rotation } = matrix;
  return { position: new Vector(x, y), scale: new Vector(sx, sy), rotation };
}

export function calculatePointInImage(point, shapeData, screenMatrix) {
  const { width, height } = shapeData.imageData;
  const centerOffset = new Vector(width / 2, height / 2);
  const matrix = shapeData.transform.multiplyMatrix(screenMatrix).inverseMatrix();

  return point
    .applyMatrix(matrix)
    .add(centerOffset)
    .round();
}

export function isNegative(transform) {
  const negativeX = transform.sx > 0;
  const negativeY = transform.sy > 0;
  return !((negativeX && negativeY) || (!negativeX && !negativeY));
}
