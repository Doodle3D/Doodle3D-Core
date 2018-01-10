import * as THREE from 'three';
import * as actions from '../../actions/index.js';
import { EventObject3D } from '../EventScene.js';
import transposeEvents from '../../utils/transposeEvents.js';

const RAY_CASTER = new THREE.Raycaster();
const MOUSE = new THREE.Vector2();

export default class BaseTransformer extends EventObject3D {
  constructor(dispatch, scene, camera, DOMNode, renderRequest) {
    super();

    // enable hit detection by default because it is needed for toggling selection
    this.enableHitDetection = true;

    this.dispatch = dispatch;
    this.scene = scene;
    this.camera = camera;
    this.DOMNode = DOMNode;
    this.renderRequest = renderRequest;
  }
  dragStart({ position, preDrags, intersections }) {
    this.dispatch(actions.d3DragStart(position, preDrags, intersections));
  }
  drag({ position, previousPosition }) {
    this.dispatch(actions.d3Drag(position, previousPosition));
  }
  dragEnd({ position }) {
    this.dispatch(actions.d3DragEnd(position));
  }
  secondDragStart({ position, preDrags, intersections }) {
    this.dispatch(actions.d3SecondDragStart(position, preDrags, intersections));
  }
  secondDrag({ position, previousPosition }) {
    this.dispatch(actions.d3SecondDrag(position, previousPosition));
  }
  secondDragEnd({ position }) {
    this.dispatch(actions.d3DragEnd(position));
  }
  tap({ position, intersections }) {
    // perhaps better to do this in a more general location
    // but currently this is the only place we have access to intersections
    this.select(intersections);

    this.dispatch(actions.d3Tap(position, intersections));
  }
  wheel({ position, wheelDelta }) {
    this.dispatch(actions.d3MouseWheel(position, wheelDelta));
  }
  multitouchStart({ positions, preDrags }) {
    this.dispatch(actions.d3MultitouchStart(positions, preDrags));
  }
  multitouch({ positions, previousPositions }) {
    this.dispatch(actions.d3Multitouch(positions, previousPositions));
  }
  multitouchEnd({ positions }) {
    this.dispatch(actions.d3MultitouchEnd(positions));
  }
  select(intersections) {
    const mesh = intersections.find(({ object }) => object.isShapeMesh);
    const bed = intersections.find(({ object }) => object.isBedPlane);

    if (mesh) {
      this.dispatch(actions.toggleSelect(mesh.object.name));
    } else {
      if (bed) {
        this.dispatch(actions.bedSelect());
      }
      this.dispatch(actions.deselectAll());
    }
  }
  onEvent(event) {
    switch (event.type) {
      case 'dragstart':
        this._previousPosition = event.position;
        break;

      case 'drag':
        event.previousPosition = this._previousPosition;
        this._previousPosition = event.position;
        break;

      case 'seconddragstart':
        this._previousSecondPosition = event.position;
        break;

      case 'seconddrag':
        event.previousPosition = this._previousSecondPosition;
        this._previousSecondPosition = event.position;
        break;

      case 'multitouchstart':
        this._previousMultitouchPositions = event.positions;
        break;

      case 'multitouch':
        event.previousPositions = this._previousMultitouchPositions;
        this._previousMultitouchPositions = event.positions;
        break;

      default:
        break;
    }

    event.intersections = [];
    if (this.enableHitDetection) {
      if (event.type === 'tap' || event.type === 'dragstart' || event.type === 'seconddragstart') {
        event.intersections = this.findHit(event.position);
      }
    }

    transposeEvents.call(this, event);
    super.onEvent(event);
  }
  getRayCaster({ x, y }) {
    MOUSE.setX((x / this.DOMNode.offsetWidth) * 2 - 1);
    MOUSE.setY(-(y / this.DOMNode.offsetHeight) * 2 + 1);

    RAY_CASTER.setFromCamera(MOUSE, this.camera);

    return RAY_CASTER;
  }
  findHit(mouse) {
    if (!this.enableHitDetection || this.scene.children.length === 0) return [];

    const rayCaster = this.getRayCaster(mouse);
    const intersections = rayCaster.intersectObjects(this.scene.children, true);

    return intersections;
  }
  updateSpriteScale() {
    for (const sprite of this.children) {
      if (!(sprite.isUIHandle) || !sprite.material.map) continue;

      const scale = sprite.position.distanceTo(this.camera.getWorldPosition()) / 2000.0;
      const { width, height } = sprite.material.map.image;
      sprite.scale.set(width * scale, height * scale, 0); // TODO only if changed
    }
  }
  destroy() {}
}
