import * as contextTools from './contextTools.js';

export const LINE_WIDTH = 3;
export const LINE_COLLISION_MARGIN = 4;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 10;
export const CANVAS_SIZE = 100;
export const GRID_SIZE = 10;
export const IMAGE_GUIDE_TRANSPARENCY = 1.0;
export const FILL_TRANSPARENCY = 0.9;
export const LINE_TRANSPARENCY = 1.0;
export const DESELECT_TRANSPARENCY = 0.2;
// default flood fill tolereance of image trace
export const DEFAULT_TRACE_TOLERANCE = 20;
// initial scale of image inside workspace
export const INITIAL_IMAGE_SCALE = 0.8;
// big images can lead to performance penalties, images bigger then MAX_IMAGE_SIZE get scaled down
export const MAX_IMAGE_SIZE = 1000;
// TODO we want to use different snapping distances for mouse and for touch events
export const SNAPPING_DISTANCE = 7.0;
export const MAX_TRACE_TOLERANCE = 256;
export const SELECTION_VIEW_MIN_SCALE = 50;
export const SELECTION_VIEW_MIN_AXIS_SCALE = 80;
export const ERASER_SIZES = {
  [contextTools.ERASER_SIZE_SMALL]: 10,
  [contextTools.ERASER_SIZE_MEDIUM]: 30,
  [contextTools.ERASER_SIZE_LARGE]: 50
};
// sizes are in mm
export const BRUSH_SIZES = {
  [contextTools.BRUSH_SIZE_SMALL]: 1,
  [contextTools.BRUSH_SIZE_MEDIUM]: 2,
  [contextTools.BRUSH_SIZE_LARGE]: 5
};

export const CLIPPER_PRECISION = 100; // accurate to the hundredth
export const TEXT_TOOL_FONT_SIZE = 40;
