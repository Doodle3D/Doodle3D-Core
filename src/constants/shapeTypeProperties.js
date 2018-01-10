import { Vector, Matrix } from '@doodle3d/cal';
import * as d2Tools from './d2Tools';
import * as d3Tools from './d3Tools';
import * as contextTools from './contextTools';
import { FONT_FACE } from '../constants/general.js';

const SHAPE = {
  D3Visible: true,
  snapping: false,
  tools: {
    [d2Tools.BUCKET]: true,
    [d2Tools.ERASER]: true,
    [d3Tools.HEIGHT]: true,
    [d3Tools.SCULPT]: true,
    [d3Tools.TWIST]: true
  }
};

const defaultProperties = {
  height: 20.0,
  transform: new Matrix(),
  z: 0.0,
  sculpt: [{ pos: 0.0, scale: 1.0 }, { pos: 1.0, scale: 1.0 }],
  twist: 0.0,
  fill: false,
  solid: true
};

export const SHAPE_TYPE_PROPERTIES = {
  RECT: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, rectSize: new Vector() }
  },
  TRIANGLE: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, triangleSize: new Vector() }
  },
  STAR: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, star: { innerRadius: 0, outerRadius: 0, rays: 5 } }
  },
  CIRCLE: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, circle: { radius: 0, segment: 0 } }
  },
  CIRCLE_SEGMENT: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, circle: { radius: 0, segment: 0 } }
  },
  COMPOUND_PATH: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, points: [], holes: [], fill: true }
  },
  FREE_HAND: {
    ...SHAPE,
    snapping: true,
    defaultProperties: { ...defaultProperties, points: [] }
  },
  TEXT: {
    ...SHAPE,
    defaultProperties: {
      ...defaultProperties,
      text: { text: '', family: FONT_FACE[contextTools.OSWALD], weight: 'normal', style: 'normal' },
      fill: true
    }
  },
  IMAGE_GUIDE: {
    ...SHAPE,
    defaultProperties: {
      ...defaultProperties,
      imageData: { width: 1, height: 1, data: '' },
      height: 1,
      fill: true
    },
    D3Visible: false,
    tools: {
      ...SHAPE.tools,
      [d2Tools.BUCKET]: false,
      [d2Tools.ERASER]: false,
      [d3Tools.HEIGHT]: false,
      [d3Tools.SCULPT]: false,
      [d3Tools.TWIST]: false
    }
  },
  POLY_POINTS: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, shape: { numPoints: 6, radius: 0 } }
  },
  HEART: {
    ...SHAPE,
    defaultProperties: { ...defaultProperties, shape: { width: 30.0, height: 30.0 } }
  },
  POLYGON: {
    ...SHAPE,
    snapping: true,
    defaultProperties: { ...defaultProperties, points: [] }
  },
  BRUSH: {
    ...SHAPE,
    snapping: false,
    defaultProperties: { ...defaultProperties, points: [], strokeWidth: 10, fill: true }
  },
  EXPORT_SHAPE: {
    ...SHAPE,
    defaultProperties: {
      ...defaultProperties,
      shapes: [],
      fill: true
    }
  }
};
