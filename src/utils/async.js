export function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve), timeout);
}

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

export function asyncIterator(array, callback) {
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

export function createThrottle() {
  let next = null;

  return callback => {
    const startLoop = next === null;
    next = callback;

    if (!startLoop) return null;

    return (function loop() {
      const promise = next().then(() => {
        if (typeof next === 'function') return loop();
      });
      next = true;
      return promise;
    })().then(() => {
      next = null;
    });
  };
}

// export function createThrottle() {
//   let next = null;
//
//   return async callback => {
//     const startLoop = next === null;
//     next = callback;
//
//     if (!startLoop) return;
//
//     while (typeof next === 'function') {
//       callback = next;
//       next = true;
//       await callback();
//     }
//
//     next = null;
//   };
// }
