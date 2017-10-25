import { Vector } from '@doodle3d/cal';

// Some basic util function to apply matrix on shapes and convert points to Vector
// returns [...point] with matrix applied to each point
export const applyMatrixOnPath = (path, matrix) => path.map(point => point.applyMatrix(matrix));
// returns [...[...point]] with matrix applied to each point
export const applyMatrixOnShape = (shape, matrix) => shape.map(path => applyMatrixOnPath(path, matrix));
// converts any type object to CAL.Vector instance
export const pointToVector = ({ x, y }) => new Vector(x, y);
// returns [...point] with point converted to a CAL.Vector Instance
export const pathToVectorPath = (path) => path.map(pointToVector);
// returns [...[...point]] with point converted to a CAL.Vector Instance
export const shapeToVectorShape = (shape) => shape.map(pathToVectorPath);
