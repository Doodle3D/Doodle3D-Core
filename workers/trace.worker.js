import 'babel-polyfill';
import * as POTRACE from '@doodle3d/potrace-js';

const POTRACE_OPTIONS = {
  turnpolicy: 'black',
  turdsize: 5.0,
  optcurve: false,
  alphamax: 0.5,
  opttolerance: 0.2
};

self.addEventListener('message', (event) => {
  switch (event.data.msg) {
    case 'FLOOD_FILL':
      const { imageData, start, tolerance } = event.data;

      self.postMessage({
        msg: 'FLOOD_FILL',
        status: 'OK',
        traceData: floodFill(imageData, start, tolerance)
      });
      break;

    case 'TRACE':
      const { fill, width, height } = event.data;

      const bitmap = new POTRACE.Bitmap(width, height);
      for (let i = 0; i < fill.length; i ++) {
        const index = fill[i];
        bitmap.data[index] = 1;
      }

      self.postMessage({
        msg: 'TRACE',
        status: 'OK',
        paths: POTRACE.getPaths(POTRACE.traceBitmap(bitmap, POTRACE_OPTIONS))
      });
      break;

    default:
      break;
  }
});

function floodFill(imageData, start, tolerance) {
  const { width, height } = imageData;

  const compairIndex = start.y * width + start.x;
  const stack = [compairIndex];
  const done = { [compairIndex]: true };

  const edge = [];
  const fill = [];

  while (stack.length > 0) {
    const index = stack.pop();

    const value = imageData.data[index];
    const pass = value < tolerance;

    if (!pass) {
      edge.push(index);
      continue;
    }

    fill.push(index);

    const left = index % width !== 0;
    const right = index % width !== width - 1;
    const top = Math.floor(index / width) !== 0;
    const bottom = Math.floor(index / width) !== height - 1;

    const neighbours = [];
    if (left) neighbours.push(index - 1);
    if (right) neighbours.push(index + 1);
    if (top) neighbours.push(index - width);
    if (bottom) neighbours.push(index + width);

    if (neighbours.length !== 4) edge.push(index);

    for (let i = 0; i < neighbours.length; i ++) {
      const neighbourIndex = neighbours[i];

      if (!done[neighbourIndex]) stack.push(neighbourIndex);
      done[neighbourIndex] = true;
    }
  }

  return { edge, fill };
}
