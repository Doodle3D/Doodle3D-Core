/* make sure the given function only returns a new array when:
 * - the resulting array has a different length
 * - items in the array changed
 */
export default function arrayMemoizer(fn) {
  let prevArgs;
  let prevResult;
  return function memoized() {
    // if same arguments; return prev result;
    if (prevArgs && shallowEquals(arguments, prevArgs) && prevResult) {
      return prevResult;
    }
    prevArgs = arguments;

    const result = fn.apply(this, arguments);
    // if no prevResult; return new result
    if (!prevResult) {
      prevResult = result;
      return prevResult;
    }

    if (shallowEquals(result, prevResult)) {
      // if array isn't changed; return prev result
      return prevResult;
    } else {
      // if changed; return new result
      prevResult = result;
      return prevResult;
    }
  };
}

function shallowEquals(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i in arr1) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
