import update from 'react-addons-update';
import * as actions from '../../../actions/index.js';
import { MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM, MAX_CAMERA_PAN } from '../../../constants/d3Constants.js';
import * as THREE from 'three';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:camera');

const CAMERA_STATES = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
const PAN_SPEED = 0.001;
const ZOOM_SPEED = 0.001;
const ROTATION_SPEED = 0.005;

export const defaultCamera = {
  object: new THREE.PerspectiveCamera(),
  center: new THREE.Vector3(0, 0, 0),
  state: CAMERA_STATES.NONE
};
defaultCamera.object.position.set(0, 125, 250);
defaultCamera.object.lookAt(defaultCamera.center);
defaultCamera.object.updateMatrix();

export function cameraReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.D3_MOUSE_WHEEL: {
      if (state.disableScroll) return state;
      const delta = new THREE.Vector3(0, 0, action.wheelDelta);
      return update(state, {
        d3: { camera: { $set: zoom(state.d3.camera, delta) } }
      });
    }

    case actions.D3_DRAG_START: {
      return update(state, {
        d3: { camera: { state: { $set: CAMERA_STATES.ROTATE } } }
      });
    }

    case actions.D3_SECOND_DRAG_START: {
      return update(state, {
        d3: { camera: { state: { $set: CAMERA_STATES.PAN } } }
      });
    }

    case actions.D3_DRAG:
    case actions.D3_SECOND_DRAG: {
      const movement = action.position.subtract(action.previousPosition);

      switch (state.d3.camera.state) {
        case CAMERA_STATES.ROTATE: {
          const delta = new THREE.Vector3(-movement.x * ROTATION_SPEED, -movement.y * ROTATION_SPEED, 0);
          return update(state, {
            d3: { camera: { $set: rotate(state.d3.camera, delta) } }
          });
        }
        case CAMERA_STATES.PAN: {
          const delta = new THREE.Vector3(-movement.x, movement.y, 0);
          return update(state, {
            d3: { camera: { $set: pan(state.d3.camera, delta) } }
          });
        }
        case CAMERA_STATES.ZOOM: {
          const delta = new THREE.Vector3(0, 0, movement.y);
          return update(state, {
            d3: { camera: { $set: zoom(state.d3.camera, delta) } }
          });
        }
        default:
          return state;
      }
      break;
    }

    case actions.D3_DRAG_END:
    case actions.D3_SECOND_DRAG_END:
      return update(state, {
        d3: { camera: { state: { $set: CAMERA_STATES.NONE } } }
      });

    case actions.D3_MULTITOUCH: {
      const distance = action.positions[0].distanceTo(action.positions[1]);
      const prevDistance = action.previousPositions[0].distanceTo(action.previousPositions[1]);

      const zoomDelta = new THREE.Vector3(0, 0, prevDistance - distance);
      state = update(state, {
        d3: { camera: { $set: zoom(state.d3.camera, zoomDelta) } }
      });

      const offset0 = new THREE.Vector3(
        -(action.positions[0].x - action.previousPositions[0].x),
        action.positions[0].y - action.previousPositions[0].y,
        0
      );
      const offset1 = new THREE.Vector3(
        -(action.positions[1].x - action.previousPositions[1].x),
        action.positions[1].y - action.previousPositions[1].y,
        0
      );
      const panDelta = offset0.add(offset1).multiplyScalar(0.5);

      return update(state, {
        d3: { camera: { $set: pan(state.d3.camera, panDelta) } }
      });
    }

    default:
      return state;
  }
}

function rotate(state, delta) {
  let { center, object } = state;
  object = new THREE.PerspectiveCamera().copy(state.object);
  center = new THREE.Vector3().copy(center);

  const vector = new THREE.Vector3().copy(object.position).sub(center);
  const spherical = new THREE.Spherical().setFromVector3(vector);
  spherical.theta += delta.x;
  spherical.phi += delta.y;
  spherical.makeSafe();
  vector.setFromSpherical(spherical);

  object.position.copy(center).add(vector);
  object.lookAt(center);

  object.updateMatrix();

  return update(state, {
    object: { $set: object }
  });
}

function pan(state, delta) {
  let { center, object } = state;
  object = new THREE.PerspectiveCamera().copy(state.object);
  center = new THREE.Vector3().copy(center);

  const distance = object.position.distanceTo(center);

  delta.multiplyScalar(distance * PAN_SPEED);
  delta.applyMatrix3(new THREE.Matrix3().getNormalMatrix(object.matrix));
  delta.add(center).clampLength(0.0, MAX_CAMERA_PAN).sub(center);

  object.position.add(delta);
  center.add(delta);

  object.updateMatrix();

  return update(state, {
    object: { $set: object },
    center: { $set: center }
  });
}

function zoom(state, delta) {
  let { center, object } = state;
  object = new THREE.PerspectiveCamera().copy(state.object);
  center = new THREE.Vector3().copy(center);

  const distance = object.position.distanceTo(center);
  delta.multiplyScalar(distance * ZOOM_SPEED);

  if (delta.length() > distance) return state;

  delta.applyMatrix3(new THREE.Matrix3().getNormalMatrix(object.matrix));
  object.position.add(delta);
  object.position.sub(center).clampLength(MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM).add(center);

  object.updateMatrix();

  return update(state, {
    object: { $set: object }
  });
}
