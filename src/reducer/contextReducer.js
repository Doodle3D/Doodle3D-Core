import update from 'react-addons-update';
import * as contextTools from '../constants/contextTools.js';
import { COLOR_STRING_TO_HEX, COLOR_HEX_TO_STRING } from '../constants/general.js';
import { ERASER_SIZES, BRUSH_SIZES } from '../constants/d2Constants.js';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import * as actions from '../actions/index.js';
import { select } from './menusReducer.js';
import { getSelectedObjectsSelector, getBoundingBox } from '../utils/selectionUtils.js';
import { Matrix } from 'cal';

export default function (state, action) {
  switch (action.category) {
    case actions.CAT_SELECTION: {
      let menus = state.menus;

      const [firstSelected] = state.selection.objects;
      const colorHex = firstSelected ? state.objectsById[firstSelected.id].color : state.context.color;
      // pick current draw color when color is unknown
      const color = COLOR_HEX_TO_STRING[colorHex] || COLOR_HEX_TO_STRING[state.context.color];
      menus = select(menus, color);

      const fillBool = firstSelected && state.objectsById[firstSelected.id].fill;
      const fill = fillBool ? contextTools.FILL_TOGGLE_FILL : contextTools.FILL_TOGGLE_OUTLINE;
      menus = select(menus, fill);

      const solidBool = firstSelected && state.objectsById[firstSelected.id].solid;
      const solid = solidBool ? contextTools.HOLE_TOGGLE_SOLID : contextTools.HOLE_TOGGLE_HOLE;
      menus = select(menus, solid);

      return update(state, { menus: { $set: menus } });
    }

    default:
      break;
  }

  switch (action.type) {
    case actions.D2_CHANGE_TOOL: {
      const color = COLOR_HEX_TO_STRING[state.context.color];
      return update(state, {
        menus: { $set: select(state.menus, color) }
      });
    }

    default:
      break;
  }

  switch (action.tool) {
    case contextTools.LIGHT_BLUE:
    case contextTools.LIGHT_GREEN:
    case contextTools.LIGHT_PINK:
    case contextTools.LIGHT_YELLOW:
    case contextTools.BLUE:
    case contextTools.GREEN:
    case contextTools.PINK:
    case contextTools.YELLOW:
    case contextTools.DARK_BLUE:
    case contextTools.DARK_GREEN:
    case contextTools.DARK_PINK:
    case contextTools.DARK_YELLOW: {
      const color = COLOR_STRING_TO_HEX[action.tool];
      return update(state, {
        objectsById: state.selection.objects.reduce((updateObject, { id }) => {
          updateObject[id] = { color: { $set: color } };
          return updateObject;
        }, {}),
        context: {
          color: { $set: color }
        }
      });
    }

    case contextTools.ERASER_SIZE_SMALL:
    case contextTools.ERASER_SIZE_MEDIUM:
    case contextTools.ERASER_SIZE_LARGE: {
      const size = ERASER_SIZES[action.tool];
      return update(state, {
        d2: {
          eraser: {
            size: { $set: size }
          }
        }
      });
    }

    case contextTools.BRUSH_SIZE_SMALL:
    case contextTools.BRUSH_SIZE_MEDIUM:
    case contextTools.BRUSH_SIZE_LARGE: {
      const size = BRUSH_SIZES[action.tool];
      return update(state, {
        d2: {
          brush: {
            size: { $set: size }
          }
        }
      });
    }

    case contextTools.FILL_TOGGLE_FILL:
    case contextTools.FILL_TOGGLE_OUTLINE: {
      const fill = action.tool === contextTools.FILL_TOGGLE_FILL;

      return update(state, {
        objectsById: state.selection.objects.reduce((updateObject, { id }) => {
          const { type } = state.objectsById[id];
          const d3Visible = SHAPE_TYPE_PROPERTIES[type].D3Visible;
          if (d3Visible) updateObject[id] = { fill: { $set: fill } };
          return updateObject;
        }, {})
      });
    }

    case contextTools.HOLE_TOGGLE_HOLE:
    case contextTools.HOLE_TOGGLE_SOLID: {
      const solid = action.tool === contextTools.HOLE_TOGGLE_SOLID;

      return update(state, {
        objectsById: state.selection.objects.reduce((updateObject, { id }) => {
          const { fill, type } = state.objectsById[id];
          const d3Visible = SHAPE_TYPE_PROPERTIES[type].D3Visible;
          if (fill && d3Visible) updateObject[id] = { solid: { $set: solid } };
          return updateObject;
        }, {})
      });
    }

    case contextTools.ALIGN_LEFT:
    case contextTools.ALIGN_HORIZONTAL:
    case contextTools.ALIGN_RIGHT:
    case contextTools.ALIGN_TOP:
    case contextTools.ALIGN_VERTICAL:
    case contextTools.ALIGN_BOTTOM: {
      if (state.selection.objects < 2) return state;

      const selection = state.selection;
      const selectedShapeDatas = getSelectedObjectsSelector(selection.objects, state.objectsById);
      const totalBoundingBox = getBoundingBox(selectedShapeDatas);

      for (const shapeData of selectedShapeDatas) {
        const boundingBox = getBoundingBox([shapeData]);

        let deltaX = 0;
        let deltaY = 0;
        switch (action.tool) {
          case contextTools.ALIGN_LEFT:
            deltaX = totalBoundingBox.min.x - boundingBox.min.x;
            break;
          case contextTools.ALIGN_HORIZONTAL:
            deltaX = totalBoundingBox.center.x - boundingBox.center.x;
            break;
          case contextTools.ALIGN_RIGHT:
            deltaX = totalBoundingBox.max.x - boundingBox.max.x;
            break;
          case contextTools.ALIGN_TOP:
            deltaY = totalBoundingBox.min.z - boundingBox.min.z;
            break;
          case contextTools.ALIGN_VERTICAL:
            deltaY = totalBoundingBox.center.y - boundingBox.center.y;
            break;
          case contextTools.ALIGN_BOTTOM:
            deltaY = totalBoundingBox.max.z - boundingBox.max.z;
            break;
          default:
            break;
        }

        const transform = state.objectsById[shapeData.UID].transform.translate(deltaX, deltaY);

        state = update(state, {
          objectsById: {
            [shapeData.UID]: {
              transform: { $set: transform }
            }
          },
          selection: {
            objects: {
              [selection.objects.findIndex(({ id }) => id === shapeData.UID)]: {
                initialTransform: { $set: transform }
              }
            }
          }
        });
      }

      state = update(state, {
        selection: {
          transform: { $set: new Matrix() }
        }
      });

      return state;
    }

    default:
      return state;
  }
}
