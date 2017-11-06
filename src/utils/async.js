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
  return new Promise((resolve, reject) => {
    const results = [];
    let i = 0;

    function loop() {
      if (i === array.length) return resolve(results);

      const item = array[i];
      callback(item, i, array).then(result => {
        results.push(result);
        i ++;
        loop();
      }).catch(reject);
    }
    loop();
  });
}

// export async function asyncIterator(array, callback) {
//   const result = [];
//   for (let i = 0; i < array.length; i ++) {
//     const item = array[i];
//     const itemResult = await callback(item, i, array);
//     result.push(itemResult);
//   }
//   return result;
// }
