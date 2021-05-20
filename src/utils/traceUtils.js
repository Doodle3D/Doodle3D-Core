import { applyMatrixOnPath, pathToVectorPath } from './vectorUtils.js';
import { Matrix } from '@doodle3d/cal';
import TraceWorker from '../../workers/trace.worker.js';
import { getPixel } from './colorUtils.js';
import memoize from 'memoizee';

const TRACE_WORKER = new TraceWorker();

export const prepareImageData = memoize(prepareImageDataRaw, { max: 1 });
function prepareImageDataRaw(canvas, x, y) {
  const { width, height } = canvas;
  const imageData = canvas.getContext('2d').getImageData(0, 0, width, height);

  const compairValue = getPixel(imageData, y * width + x);

  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i ++) {
    const pixel = getPixel(imageData, i);
    const r = Math.abs(pixel.r - compairValue.r);
    const g = Math.abs(pixel.g - compairValue.g);
    const b = Math.abs(pixel.b - compairValue.b);

    const value = Math.max(r, g, b);

    data[i] = value;
  }

  return { width, height, data };
}

const FLOOD_FILL_MULTIPLIER = 0.4;
export function calculateTolerance(start, current) {
  const tolerance = start.distanceTo(current) * FLOOD_FILL_MULTIPLIER;

  return tolerance;
}

export function floodFill(tolerance, image, start) {
  const imageData = prepareImageData(image, start.x, start.y);

  return new Promise((resolve, reject) => {
    const callback = ({ data }) => {
      switch (data.msg) {
        case 'FLOOD_FILL':
          TRACE_WORKER.removeEventListener('message', callback);

          if (data.status === 'OK') {
            resolve(data.traceData);
          } else {
            reject(data.error);
          }
          break;

        default:
          break;
      }
    };
    TRACE_WORKER.addEventListener('message', callback);

    TRACE_WORKER.postMessage({
      msg: 'FLOOD_FILL',
      tolerance, imageData, start
    });
  });
}

export function traceFloodFill(traceData, shapeData) {
  const { fill } = traceData;
  const { width, height } = shapeData.imageData;

  return new Promise((resolve, reject) => {
    const callback = ({ data }) => {
      switch (data.msg) {
        case 'TRACE':
          TRACE_WORKER.removeEventListener('message', callback);

          const transform = new Matrix()
            .translate(width / -2, height / -2)
            .multiplyMatrix(shapeData.transform);

          const paths = data.paths
            .map(pathToVectorPath)
            .map(path => applyMatrixOnPath(path, transform));

          if (data.status === 'OK') {
            resolve(paths);
          } else {
            reject(data.error);
          }
          break;

        default:
          break;
      }
    };
    TRACE_WORKER.addEventListener('message', callback);

    TRACE_WORKER.postMessage({
      msg: 'TRACE',
      fill, width, height
    });
  });
}
