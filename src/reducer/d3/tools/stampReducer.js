import * as actions from '../../../actions/index.js';
import { addObject, addSpaceActive } from '../../objectReducers.js';
import { recursiveClone } from '../../../utils/clone.js';
import { getBoundingBox, getSelectedObjectsSelector } from '../../../utils/selectionUtils.js';
import { updateInitTransform } from '../../d2/tools/transformReducer.js';
import update from 'react-addons-update';
import * as THREE from 'three';
// import createDebug from 'debug';
// const debug = createDebug('d3d:reducer:height');

const ROTATION_MATRIX = new THREE.Matrix4().makeRotationX(Math.PI / 2);

export default function heightReducer(state, action) {
  // if (action.log !== false) debug(action.type);

  switch (action.type) {
    case actions.STAMP: {
      const { point: position, face: { normal }, object } = action.hit;
      // apply world rotation on normal so 'space transformations' are applied on the normal
      normal.applyEuler(object.getWorldRotation());

      // flip normal when clicking on backside of a face
      const incidence = new THREE.Vector3().subVectors(state.d3.camera.object.position, position).normalize();
      if (normal.dot(incidence) > 0) normal.multiplyScalar(-1);

      // calculate space transformation based on collision click and face normal
      const matrix = new THREE.Matrix4();
      matrix.lookAt(new THREE.Vector3(0, 0, 0), normal, new THREE.Vector3(0, 1, 0));
      matrix.multiply(ROTATION_MATRIX);
      matrix.setPosition(position);

      state = addSpaceActive(state, matrix);

      const selectedObjects = state.selection.objects;
      const boundingbox = getBoundingBox(getSelectedObjectsSelector(selectedObjects, state.objectsById));

      for (const { id } of selectedObjects) {
        const shapeData = recursiveClone(state.objectsById[id]);
        shapeData.transform = shapeData.transform.translate(-boundingbox.center.x, -boundingbox.center.y);
        delete shapeData.space;
        state = addObject(state, shapeData);
      }

      return updateInitTransform(update(state, {
        selection: {
          objects: { $set: state.spaces[state.activeSpace].objectIds.map(id => ({ id })) }
        }
      }));
    }

    default:
      return state;
  }
}
