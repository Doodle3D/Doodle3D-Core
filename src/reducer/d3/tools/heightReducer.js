import update from 'react-addons-update';
import { Utils } from '@doodle3d/cal';
import * as THREE from 'three';
import { SHAPE_TYPE_PROPERTIES } from '../../../constants/shapeTypeProperties.js';
import * as d3Tools from '../../../constants/d3Tools.js';
import { getSelectedObjectsSelector, getBoundingBox } from '../../../utils/selectionUtils.js';
import * as actions from '../../../actions/index.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:height');

const { MathExtended } = Utils;

const MIN_HEIGHT = 1;
const MAX_HEIGHT = 600;
const CHANGE_FACTOR = 0.5;

export default function heightReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.HEIGHT_START:
    case actions.HEIGHT_END: {
      state = update(state, {
        d3: {
          height: {
            active: { $set: action.type === actions.HEIGHT_START },
            handle: { $set: action.type === actions.HEIGHT_START ? action.handle : '' }
          }
        }
      });
      return state;
    }

    case actions.HEIGHT: {
      const cameraAngle = new THREE.Vector3()
        .set(action.delta.x, -action.delta.y, 0)
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(state.d3.camera.object.matrix));

      const sceneUp = new THREE.Vector3(0, 1, 0)
        .applyMatrix4(new THREE.Matrix4().extractRotation(state.spaces[state.activeSpace].matrix));

      let delta = cameraAngle.dot(sceneUp) * CHANGE_FACTOR;

      const selectedShapeDatas = getSelectedObjectsSelector(state.selection.objects, state.objectsById);
      const { min, max } = getBoundingBox(selectedShapeDatas, state.selection.transform);
      const totalHeight = max.y - min.y;

      state = update(state, {
        objectsById: state.selection.objects
          .map(({ id }) => state.objectsById[id])
          .filter(shapeData => SHAPE_TYPE_PROPERTIES[shapeData.type].tools[d3Tools.HEIGHT])
          .reduce((updateObject, shapeData) => {
            let height;
            let z;
            switch (state.d3.height.handle) {
              case 'top': {
                delta -= Math.max(max.y + delta - MAX_HEIGHT, 0);
                const scale = (totalHeight + delta) / totalHeight;

                height = shapeData.height * scale;
                z = (shapeData.z - min.y) * scale + min.y;
                break;
              }

              case 'bottom': {
                delta -= Math.min(min.y + delta, 0);
                const scale = (totalHeight - delta) / totalHeight;

                height = shapeData.height * scale;
                z = (shapeData.z - min.y) * scale + min.y + delta;
                break;
              }

              case 'translate':
                height = shapeData.height;
                z = shapeData.z + delta;
                break;

              default:
                return updateObject;
            }

            height = MathExtended.clamb(height, MIN_HEIGHT, MAX_HEIGHT - MIN_HEIGHT);
            z = MathExtended.clamb(z, 0, MAX_HEIGHT - height);

            updateObject[shapeData.UID] = {
              height: { $set: height },
              z: { $set: z }
            };
            return updateObject;
          }, {})
      });

      return state;
    }

    default:
      return state;
  }
}
