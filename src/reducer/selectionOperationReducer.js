import update from 'react-addons-update';
import ClipperShape from '@doodle3d/clipper-js';
import { Matrix } from '@doodle3d/cal';
import { addObject, removeObject } from './objectReducers.js';
import { recursiveClone } from '../utils/clone.js';
import { shapeToPoints } from '../shape/shapeToPoints.js';
import { applyMatrixOnShape, pathToVectorPath } from '../utils/vectorUtils.js';
import subtractShapeFromState from '../utils/subtractShapeFromState.js';
import * as d2Tools from '../constants/d2Tools';
import { CLIPPER_PRECISION } from '../constants/d2Constants.js';
import * as actions from '../actions/index.js';

const LINE_WIDTH = 0.5;

export default function (state, action) {
  switch (action.type) {
    case actions.DELETE_SELECTION:
      for (const { id } of state.selection.objects) {
        state = removeObject(state, id);
      }

      state = update(state, {
        selection: {
          objects: { $set: [] }
        }
      });

      return state;

    case actions.DUPLICATE_SELECTION:
      for (const { id } of state.selection.objects) {
        const shapeData = state.objectsById[id];
        state = addObject(state, recursiveClone(shapeData));
      }

      // force update selection so alpha is redrawn
      state = update(state, {
        selection: {
          objects: { $set: [...state.selection.objects] }
        }
      });

      return state;

    case actions.UNION: {
      let unionShape = new ClipperShape([], true);

      const shapeDataDictation = state.objectsById[state.selection.objects[0].id];

      for (const { id } of state.selection.objects) {
        const shapeData = state.objectsById[id];

        if (!shapeData.fill) continue;

        state = removeObject(state, id);

        const shapes = applyMatrixOnShape(
          shapeToPoints(shapeData).reduce((a, { points, holes }) => a.concat([points, ...holes]), []),
          shapeData.transform
        );

        const shape = new ClipperShape(shapes, shapeData.fill, true, false, false)
          .scaleUp(CLIPPER_PRECISION)
          .round();
        unionShape = unionShape.union(shape);
      }

      const unionShapes = unionShape.scaleDown(CLIPPER_PRECISION).separateShapes().map(shape => {
        shape = shape
          .removeDuplicates()
          .mapToLower()
          .map(pathToVectorPath);
        shape.forEach(path => path.push(path[0].clone()));
        return shape;
      });

      for (const shape of unionShapes) {
        const [points, ...holes] = shape;

        state = addObject(state, {
          ...recursiveClone(shapeDataDictation),
          type: 'COMPOUND_PATH',
          transform: new Matrix(),
          points,
          holes
        });
      }

      state = update(state, {
        selection: {
          objects: { $set: [] }
        }
      });

      return state;
    }

    case actions.INTERSECT: {
      let unionShape = new ClipperShape([], true);

      for (const { id } of state.selection.objects) {
        const shapeData = state.objectsById[id];

        const shapes = applyMatrixOnShape(
          shapeToPoints(shapeData).reduce((a, { points, holes }) => a.concat([points, ...holes]), []),
          shapeData.transform
        );

        let shape = new ClipperShape(shapes, shapeData.fill, true, false, false)
          .scaleUp(CLIPPER_PRECISION)
          .round();
        if (!shapeData.fill) {
          shape = shape
            .offset(LINE_WIDTH * CLIPPER_PRECISION, { jointType: 'jtSquare', endType: 'etOpenButt' })
            .simplify('pftNonZero');
        }
        unionShape = unionShape.union(shape);
      }

      unionShape = unionShape.scaleDown(CLIPPER_PRECISION);

      state = subtractShapeFromState(state, unionShape, d2Tools.ERASER, {
        scale: CLIPPER_PRECISION,
        skip: state.selection.objects.map(({ id }) => id)
      });

      // force update selection so alpha is redrawn
      state = update(state, {
        selection: {
          objects: { $set: [...state.selection.objects] }
        }
      });

      return state;
    }

    default:
      return state;
  }
}
