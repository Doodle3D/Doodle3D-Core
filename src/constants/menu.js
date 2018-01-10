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
    { value: d3Tools.TWIST }
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
      svg: `#btnColor`,
      selected: contextTools.LIGHT_BLUE_B,
      children: [
        { value: contextTools.HOLE_MATERIAL, svg: '#color-picker-empty-fill' },
        { value: contextTools.LIGHT_BLUE_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.DARK_BLUE_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.PURPLE_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.PINK_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.RED_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.YELLOW_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.GREEN_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.BLACK_A, svg: '#color-picker-empty-fill' },
        { value: contextTools.PIPETTE },
        { value: contextTools.LIGHT_BLUE_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.DARK_BLUE_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.PURPLE_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.PINK_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.RED_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.YELLOW_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.GREEN_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.BLACK_B, svg: '#color-picker-empty-fill' },
        { value: contextTools.LIGHT_BLUE_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.DARK_BLUE_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.PURPLE_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.PINK_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.RED_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.YELLOW_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.GREEN_C, svg: '#color-picker-empty-fill' },
        { value: contextTools.BLACK_C, svg: '#color-picker-empty-fill' }
      ],
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
      value: contextTools.FONT,
      selected: contextTools.OSWALD,
      children: contextTools.FONT_TOOLS.map(value => ({ value })),
      ...selectorBehavior
    },
    { value: contextTools.UNION },
    { value: contextTools.INTERSECT }
  ]
};

export default [toolbar2d, toolbar3d, context];
