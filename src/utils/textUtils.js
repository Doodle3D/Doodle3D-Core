import { SHAPE_CACHE_LIMIT } from '../constants/general.js';
import { Text } from '@doodle3d/cal';
import * as POTRACE from '@doodle3d/potrace-js';
import ClipperShape from '@doodle3d/clipper-js';
import { shapeToVectorShape } from './vectorUtils.js';
import memoize from 'memoizee';

const MARGIN = 200;

export const createText = memoize(createTextRaw, { max: SHAPE_CACHE_LIMIT });
export function createTextRaw(text, size, precision, family, style, weight) {
  if (text === '') return [];

  const canvas = createTextCanvas(text, size * precision, family, style, weight);

  // TODO merge with potrace in flood fill trace reducer
  const paths = POTRACE.getPaths(POTRACE.traceCanvas(canvas, {
    turnpolicy: 'black',
    turdsize: 5.0,
    optcurve: false,
    alphamax: 0.5,
    opttolerance: 0.2
  }));

  const pathsOffset = paths.map(path => path.map(({ x, y }) => ({
    x: (x - MARGIN) / precision,
    y: (y - MARGIN) / precision
  })));

  const shapes = new ClipperShape(pathsOffset, true, true, false)
    .fixOrientation()
    .separateShapes()
    .map(shape => shape.mapToLower())
    .map(shapeToVectorShape);

  return shapes;
}

const textContext = new Text({ baseline: 'top' });
export function createTextCanvas(text, size, family, style, weight) {
  textContext.size = size;
  textContext.family = family;
  textContext.style = style;
  textContext.weight = weight;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const width = Math.ceil(textContext.measure(context, text)) + 2 * MARGIN;
  const height = size + 2 * MARGIN;

  canvas.width = width;
  canvas.height = height;

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  textContext.drawText(context, text, MARGIN, MARGIN);

  return canvas;
}
