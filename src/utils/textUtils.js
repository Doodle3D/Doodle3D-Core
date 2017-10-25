import { SHAPE_CACHE_LIMIT } from '../constants/general.js';
import { Text } from '@doodle3d/cal';
import { POTRACE_OPTIONS } from '../constants/d2Constants.js';
import * as POTRACE from '@doodle3d/potrace-js';
import ClipperShape from '@doodle3d/clipper-js';
import { shapeToVectorShape } from './vectorUtils.js';
import memoize from 'memoizee';

const MARGIN = 200;

export const createText = memoize(createTextRaw, { max: SHAPE_CACHE_LIMIT });
export function createTextRaw(text, size, family, style, weight) {
  if (text === '') return [];

  const { width, height, canvas } = createTextCanvas(text, size, family, style, weight);

  // TODO merge with potrace in flood fill trace reducer
  const paths = POTRACE.getPaths(POTRACE.traceCanvas(canvas, POTRACE_OPTIONS));

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const pathsOffset = paths.map(path => path.map(({ x, y }) => ({
    x: (x - halfWidth) / 10,
    y: (y - halfHeight) / 10
  })));

  const shapes = new ClipperShape(pathsOffset, true, true, false)
    .fixOrientation()
    .seperateShapes()
    .map(shape => shape.mapToLower())
    .map(shapeToVectorShape);

  return shapes;
}

const textContext = new Text();
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

  textContext.drawText(context, text, MARGIN, height / 2);

  return { width, height, canvas };
}
