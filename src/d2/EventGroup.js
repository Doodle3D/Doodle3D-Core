import { Group, Utils } from '@doodle3d/cal';
import createListener from '@doodle3d/touch-events';
import bowser from 'bowser';
import { convertEvent, isMouseEvent } from '../utils/pointerUtils.js';
import normalizeWheel from 'normalize-wheel';

const events = [
  'wheel', 'tap',
  'dragstart', 'drag', 'dragend',
  'seconddragstart', 'seconddrag', 'seconddragend',
  'multitouchstart', 'multitouch', 'multitouchend',
  'pointerdown', 'pointermove', 'pointerup', 'pointerout', 'pointerover', 'pointerleave', 'pointercancel'
];

export default class EventGroup extends Group {
  _addEventsListeners() {
    // need to add timeout because this.convert event is not defined for some reason
    setTimeout(() => {
      for (let i = 0; i < events.length; i ++) {
        const eventType = events[i];
        this._eventDispatcher.addEventListener(eventType, this.convertEvent);
      }
      this.image.addEventListener('contextmenu', this.contextMenu);
    });
  }
  _removeEventListeners() {
    for (let i = 0; i < events.length; i ++) {
      const eventType = events[i];
      this._eventDispatcher.removeEventListener(eventType, this.convertEvent);
    }
    this.image.removeEventListener('contextmenu', this.contextMenu);
  }
  contextMenu(event) {
    event.preventDefault();
  }
  convertEvent = (event) => {
    if (bowser.ios && isMouseEvent(event)) return;

    switch (event.type) {
      case 'pointerdown':
      case 'pointermove':
      case 'pointerup':
      case 'pointerover':
      case 'pointerout':
      case 'pointerleave':
      case 'pointercancel':
        this.onEvent(event);
        break;

      case 'wheel':
      case 'tap':
      case 'dragstart':
      case 'drag':
      case 'dragend':
      case 'seconddragstart':
      case 'seconddrag':
      case 'seconddragend':
      case 'multitouchstart':
      case 'multitouch':
      case 'multitouchend': {
        const gestureEvent = { type: event.type };

        const _convertEvent = convertEvent.bind(null, this.image);

        if (event.event) gestureEvent.position = _convertEvent(event.event);
        if (event.events) gestureEvent.positions = event.events.map(_convertEvent);
        if (event.preEvents) gestureEvent.preDrags = event.preEvents.map(_convertEvent);
        if (event.event && event.event.deltaY !== undefined) {
          gestureEvent.wheelDelta = normalizeWheel(event.event).pixelY;
        }

        this.onEvent(gestureEvent);
      }

      default:
        break;
    }
  };
  onEvent(event) {
    const objects = Utils.cloneArray(this.objects);

    for (let i = objects.length - 1; i >= 0; i --) {
      const object = objects[i];
      if (object.active && object.onEvent !== undefined) {
        if (object.onEvent(event, this)) break;
      }
    }
  }
  setCanvas(canvas) {
    if (this.useCanvas && this.image instanceof Node) {
      this._removeEventListeners();
    }

    super.setCanvas(canvas);

    this._eventDispatcher = createListener(canvas);

    if (this.useCanvas) {
      this._addEventsListeners();
    }

    return this;
  }
}
