export function recursiveClone(object) {
  if (object instanceof Image || object instanceof HTMLCanvasElement) {
    return object;
  } else if (object.clone instanceof Function) {
    return object.clone();
  } else if (object instanceof Array) {
    return object.map(recursiveClone);
  } else if (typeof object === 'object') {
    const clone = {};
    for (const key in object) {
      clone[key] = recursiveClone(object[key]);
    }
    return clone;
  } else {
    return object;
  }
}
