import R from 'ramda';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducers:points');

export function mergePaths(pathA, pathB, matchIndexes) {
  if (matchIndexes[0] !== -1) { // if first path's first point matches
    // always reverse first path
    const sortedA = R.reverse(pathA);
    // if matches with second path's second point reverse
    const sortedB = (matchIndexes[0] === 1) ? R.reverse(pathB) : pathB;
    // add b behind a, removing overlapping point
    return sortedA.concat(sortedB.slice(1));
  } else if (matchIndexes[1] !== -1) { // if first path's second point matches
    // no need to reorder first path
    const sortedA = pathA;
    // if matches with second path's second point reverse
    const sortedB = (matchIndexes[1] === 1) ? R.reverse(pathB) : pathB;
    // add b behind a, removing overlapping point
    return sortedA.concat(sortedB.slice(1));
  } else {
    return null;
  }
}

// get just the end points of a path
export const getEndPoints = R.juxt([R.head, R.last]);

export const getEndPointPaths = R.map(getEndPoints);

const vectorEquals = R.curry(
  (a, b) => a.equals(b)
);

// find the index of a point in an array of points
export const findPointIndex = R.curry(
  (points, point) => R.findIndex(vectorEquals(point), points)
);
export const findEndPointIndex = R.curry(
  (points, point) => findPointIndex(getEndPoints(points), point)
);

// find indexes of multiple points in array of points,
// returned as array of indexes
// Result examples:
// [0]: a's first point matches b's first point
// [1]: a's first point matches b's second point
// [-1]: a's first point matches none of b's points
// [1, 0]: a's first point matches and b's second point and a's second point matches b's first point
export const findPointsIndexes = R.curry(
  (pointsA, pointsB) => R.map(findPointIndex(pointsB), pointsA)
);
export const findEndPointsIndexes = R.curry(
  (pathA, pathB) => findPointsIndexes(
    getEndPoints(pathA),
    getEndPoints(pathB)
  )
);

// find the index of a point in an array of paths
// (paths are arrays of points)
// returns first result
// returns array with
// - index of path with matching point
// - matching index (see findPointsIndexes)
export function findPointIndexInPaths(point, paths) {
  // debug('findPointIndexInPaths: ', toString(point), toString(paths));
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    // find matching endpoints
    const index = findPointIndex(path, point);
    // debug(`  ${i}: index: `, index);
    // if found stop searching
    if (index > -1) return [i, index];
  }
  return null;
}
export const findEndPointIndexInPaths = R.curry(
  (point, paths) => findPointIndexInPaths(point, getEndPointPaths(paths))
);

// find indexes of matching points of path inside other path
// returns first result
// returns array with
// - index of path with matching point
// - array of matching indexes (see findPointsIndexes)
export function findPointsIndexesOfPathInPaths(paths, path) {
  // console.log('findPointsIndexesOfPathInPaths');
  // console.log('  paths: ', toString(paths));
  // console.log('  path: ', toString(path));
  for (let i = 0; i < paths.length; i++) {
    const otherPath = paths[i];
    // skip current path
    if (otherPath === path) continue;
    // find matching endpoints
    const indexes = findPointsIndexes(path, otherPath);
    // console.log(`  ${i}: indexes: `, indexes);
    // found any matching indexes?
    //   indexes contains any item that's larget than -1
    const foundMatch = R.any(R.lt(-1))(indexes);
    // if found stop searching
    // return index of matching path and indexes of machting end points
    if (foundMatch) return [i, indexes];
  }
  return null;
}

// find indexes of matching end points of path inside other path
// see: findPointsIndexesOfPathInPaths
export function findEndPointsIndexesOfPathInPaths(paths, path) {
  return findPointsIndexesOfPathInPaths(
    R.map(getEndPoints, paths),
    getEndPoints(path)
  );
}

// cross-compare points of multiple paths
// returns first match
// array with
// - index of path A with matching point
// - index of path B with matching point
// - array of matching indexes (see findPointsIndexes)
export function findPointIndexesOfPaths(paths) {
  // console.log('findPointIndexesOfPaths');
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const indexes = findPointsIndexesOfPathInPaths(paths, path);
    // console.log('  indexes: ', toString(indexes));
    if (indexes !== null) return [i, ...indexes];
  }
  return null;
}

// cross-compare endpoints of multiple paths
export function findEndPointIndexesOfPaths(paths) {
  return findPointIndexesOfPaths(R.map(getEndPoints, paths));
}
