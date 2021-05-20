import * as THREE from 'three';
import { Utils } from '@doodle3d/cal';
import createListener from '@doodle3d/touch-events';
import bowser from 'bowser';
import { convertEvent, isMouseEvent } from '../utils/pointerUtils.js';
import normalizeWheel from 'normalize-wheel';

const events = ['wheel', 'tap', 'dragstart', 'drag', 'dragend', 'seconddragstart', 'seconddrag',
  'seconddragend', 'multitouchstart', 'multitouch', 'multitouchend'];

export class EventScene extends THREE.Scene {
  constructor(domElement) {
    super();

    if (domElement) this.setCanvas(domElement);
  }
  _addEventsListeners() {
    for (let i = 0; i < events.length; i ++) {
      const eventType = events[i];
      this._eventDispatcher.addEventListener(eventType, this.convertEvent);
    }
    this._domElement.addEventListener('contextmenu', this.contextMenu);
  }
  _removeEventListeners() {
    for (let i = 0; i < events.length; i ++) {
      const eventType = events[i];
      this._eventDispatcher.removeEventListener(eventType, this.convertEvent);
    }
    this._domElement.removeEventListener('contextmenu', this.contextMenu);
  }
  contextMenu(event) {
    event.preventDefault();
  }
  convertEvent = (event) => {
    // Prevent delayed click events bubbling through closing menus on iOS #1026
    if (bowser.ios && isMouseEvent(event)) return;

    const gestureEvent = { type: event.type };

    const _convertEvent = convertEvent.bind(null, this._domElement);

    if (event.event) gestureEvent.position = _convertEvent(event.event);
    if (event.events) gestureEvent.positions = event.events.map(_convertEvent);
    if (event.preEvents) gestureEvent.preDrags = event.preEvents.map(_convertEvent);
    if (event.event && event.event.deltaY !== undefined) {
      gestureEvent.wheelDelta = normalizeWheel(event.event).pixelY;
    }

    this.onEvent(gestureEvent);
  };
  onEvent(event) {
    const objects = Utils.cloneArray(this.children);

    for (let i = objects.length - 1; i >= 0; i --) {
      const object = objects[i];
      if (object.onEvent && object.onEvent(event, this)) break;
    }
  }
  setCanvas(domElement) {
    if (this._eventDispatcher) this._removeEventListeners();

    this._domElement = domElement;
    if (domElement) {
      this._eventDispatcher = createListener(domElement);
      this._addEventsListeners();
    }

    return this;
  }
}

export class EventObject3D extends THREE.Object3D {
  onEvent(event) {
    const objects = Utils.cloneArray(this.children);

    for (let i = objects.length - 1; i >= 0; i --) {
      const object = objects[i];
      if (object.onEvent && object.onEvent(event, this)) break;
    }
  }
}
