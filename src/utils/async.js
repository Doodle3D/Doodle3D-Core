export function recursivePromiseApply(object, promises = [], first = true) {
  for (const key in object) {
    const value = object[key];

    if (value instanceof Promise) {
      promises.push(value);

      value.then(result => object[key] = result); // eslint-disable-line no-loop-func
    } else if (value instanceof Array || typeof value === 'object') {
      recursivePromiseApply(value, promises, false);
    }
  }

  return first && Promise.all(promises).then(() => object);
}

export async function asyncIterator(array, callback) {
  const result = [];
  for (let i = 0; i < array.length; i ++) {
    const item = array[i];
    const itemResult = await callback(item, i);
    result.push(itemResult);
  }
  return result;
}
