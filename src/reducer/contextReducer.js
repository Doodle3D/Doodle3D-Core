import update from 'react-addons-update';
import * as contextTools from '../constants/contextTools.js';
import { COLOR_STRING_TO_HEX, FONT_FACE } from '../constants/general.js';
import { ERASER_SIZES, BRUSH_SIZES } from '../constants/d2Constants.js';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import * as actions from '../actions/index.js';
import { select } from './menusReducer.js';
import { getSelectedObjectsSelector, getBoundingBox } from '../utils/selectionUtils.js';
import { Matrix } from '@doodle3d/cal';
import { updateTool as updateTool2d } from './d2/toolReducer.js';
import { updateColor } from './selectionReducer.js';

export default function (state, action) {
  switch (action.category) {
    case actions.CAT_SELECTION: {
      let menus = state.menus;

      const [firstSelected] = state.selection.objects;
      const isSolid = firstSelected ? state.objectsById[firstSelected.id].solid : true;

      const color = isSolid ? contextTools.PIPETTE : contextTools.HOLE_MATERIAL;
      menus = select(menus, color);

      const fillBool = firstSelected && state.objectsById[firstSelected.id].fill;
      const fill = fillBool ? contextTools.FILL_TOGGLE_FILL : contextTools.FILL_TOGGLE_OUTLINE;
      menus = select(menus, fill);

      return update(state, { menus: { $set: menus } });
    }

    default:
      break;
  }

  switch (action.type) {
    case actions.D2_CHANGE_TOOL: {
      const color = state.context.solid ? contextTools.PIPETTE : contextTools.HOLE_MATERIAL;

      return update(state, {
        menus: { $set: select(state.menus, color) }
      });
    }

    default:
      break;
  }

  switch (action.tool) {
    case contextTools.PIPETTE: {
      state = update(state, {
        context: {
          lastTool: { $set: state.d2.tool }
        }
      });
      state = updateTool2d(state, contextTools.PIPETTE);

      return state;
    }

    case contextTools.HOLE_MATERIAL: {
      return update(state, {
        objectsById: state.selection.objects.reduce((updateObject, { id }) => {
          updateObject[id] = { solid: { $set: false } };
          return updateObject;
        }, {}),
        context: {
          solid: { $set: false }
        }
      });
    }

    case contextTools.OSWALD:
    case contextTools.RANGA:
    case contextTools.JOTI_ONE:
    case contextTools.BELLEFAIR:
    case contextTools.LOBSTER:
    case contextTools.ABRIL_FATFACE:
    case contextTools.PLAY:
    case contextTools.FASCINATE: {
      const family = FONT_FACE[action.tool];
      const { activeShape } = state.d2;
      if (activeShape && state.objectsById[activeShape].type === 'TEXT') {
        state = update(state, { objectsById: { [activeShape]: { text: { family: { $set: family } } } } });
      }

      return update(state, {
        objectsById: state.selection.objects.reduce((updateObject, { id }) => {
          if (state.objectsById[id].type === 'TEXT') {
            updateObject[id] = { text: { family: { $set: FONT_FACE[action.tool] } } };
          }
          return updateObject;
        }, {}),
        context: {
          font: { $set: FONT_FACE[action.tool] }
        }
      });
    }

    case contextTools.LIGHT_BLUE_A:
    case contextTools.LIGHT_BLUE_B:
    case contextTools.LIGHT_BLUE_C:
    case contextTools.DARK_BLUE_A:
    case contextTools.DARK_BLUE_B:
    case contextTools.DARK_BLUE_C:
    case contextTools.PURPLE_A:
    case contextTools.PURPLE_B:
    case contextTools.PURPLE_C:
    case contextTools.PINK_A:
    case contextTools.PINK_B:
    case contextTools.PINK_C:
    case contextTools.RED_A:
    case contextTools.RED_B:
    case contextTools.RED_C:
    case contextTools.YELLOW_A:
    case contextTools.YELLOW_B:
    case contextTools.YELLOW_C:
    case contextTools.GREEN_A:
    case contextTools.GREEN_B:
    case contextTools.GREEN_C:
    case contextTools.BLACK_A:
    case contextTools.BLACK_B:
    case contextTools.BLACK_C: {
      const color = COLOR_STRING_TO_HEX[action.tool];
      const { activeShape } = state.d2;
      if (activeShape) {
        state = update(state, { objectsById: { [activeShape]: { color: { $set: color } } } });
      }

      return updateColor(state, color);
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
