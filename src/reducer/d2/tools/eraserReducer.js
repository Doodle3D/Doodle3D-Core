import * as actions from '../../../actions/index';
import ClipperShape from '@doodle3d/clipper-js';
import * as d2Tools from '../../../constants/d2Tools';
import subtractShapeFromState from '../../../utils/subtractShapeFromState';
import { CLIPPER_PRECISION } from '../../../constants/d2Constants.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:eraser');

export default function eraserReducer(state, action) {
  switch (action.type) {
    case actions.D2_TAP:
      return handleEraser(state, [action.position], action.screenMatrixZoom);

    case actions.D2_DRAG_START:
      return handleEraser(state, action.preDrags, action.screenMatrixZoom);

    case actions.D2_DRAG:
      return handleEraser(state, [action.previousPosition, action.position], action.screenMatrixZoom);

    default:
      return state;
  }
}

function handleEraser(state, path, screenMatrixZoom) {
  // create eraser line from prev mouse position to new mouse position
  const eraserShape = new ClipperShape([path], false, true, true).offset(state.d2.eraser.size, {
    jointType: 'jtRound',
    endType: 'etOpenRound',
    miterLimit: 2.0,
    roundPrecision: 0.25
  });

  return subtractShapeFromState(state, eraserShape, d2Tools.ERASER, {
    matrix: screenMatrixZoom,
    scale: CLIPPER_PRECISION
  });
}
