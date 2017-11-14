import * as d2Tools from './d2Tools.js';
import * as d3Tools from './d3Tools.js';
import * as contextTools from './contextTools.js';

const toolBehavior = {
  selectOnOpen: true,
  toggleBehavior: false
};

const selectorBehavior = {
  selectOnOpen: false,
  toggleBehavior: false
};

const toggleBehavior = {
  selectOnOpen: true,
  toggleBehavior: true
};

const toolbar2d = {
  value: 'toolbar2d',
  selected: 'pen-tools',
  children: [
    { value: d2Tools.TRANSFORM },
    {
      value: 'pen-tools',
      selected: d2Tools.FREE_HAND,
      children: d2Tools.PEN_TOOLS.map(value => ({ value })),
      ...toolBehavior
    },
    { value: d2Tools.ERASER },
    {
      value: 'shape-tools',
      selected: d2Tools.STAR,
      children: d2Tools.SHAPE_TOOLS.map(value => ({ value })),
      ...toolBehavior
    },
    { value: d2Tools.BUCKET },
    { value: d2Tools.TEXT },
    { value: d2Tools.PHOTO_GUIDE }
  ]
};
const toolbar3d = {
  value: 'toolbar3d',
  selected: d3Tools.HEIGHT,
  children: [
    { value: d3Tools.HEIGHT },
    { value: d3Tools.SCULPT },
    { value: d3Tools.TWIST },
    // { value: d3Tools.STAMP }
  ]
};
const context = {
  value: 'context',
  selected: null,
  children: [
    { value: contextTools.DUPLICATE },
    { value: contextTools.DELETE },
    {
      value: contextTools.COLOR_PICKER,
      svg: `#layer1`,
      selected: contextTools.BLUE,
      children: contextTools.COLORS.map(value => ({
        value,
        svg: `#color-picker-empty-fill`
      })),
      ...selectorBehavior
    }, {
      value: contextTools.ERASER_SIZE,
      selected: contextTools.ERASER_SIZE_MEDIUM,
      children: contextTools.ERASER_SIZE_TOOLS.map(value => ({ value })),
      ...selectorBehavior
    }, {
      value: contextTools.BRUSH_SIZE,
      selected: contextTools.BRUSH_SIZE_MEDIUM,
      children: contextTools.BRUSH_SIZE_TOOLS.map(value => ({ value })),
      ...selectorBehavior
    }, {
      value: contextTools.FILL_TOGGLE,
      selected: contextTools.FILL_TOGGLE_FILL,
      children: contextTools.FILL_TOGGLE_TOOLS.map(value => ({ value })),
      ...toggleBehavior
    }, {
      value: contextTools.ALIGN,
      selected: contextTools.ALIGN_HORIZONTAL,
      children: contextTools.ALIGN_TOOLS.map(value => ({ value })),
      ...selectorBehavior
    }, {
      value: contextTools.ADVANCED,
      selected: contextTools.UNION,
      children: contextTools.ADVANCED_TOOLS.map(value => ({ value })),
      ...selectorBehavior
    }
  ]
};

export default [toolbar2d, toolbar3d, context];
