export default function transposeEvents(event) {
  let eventHandler;

  switch (event.type) {
    case 'dragstart':
      eventHandler = this.dragStart;
      break;
    case 'drag':
      eventHandler = this.drag;
      break;
    case 'dragend':
      eventHandler = this.dragEnd;
      break;
    case 'seconddragstart':
      eventHandler = this.secondDragStart;
      break;
    case 'seconddrag':
      eventHandler = this.secondDrag;
      break;
    case 'seconddragend':
      eventHandler = this.secondDragEnd;
      break;
    case 'tap':
      eventHandler = this.tap;
      break;
    case 'wheel':
      eventHandler = this.wheel;
      break;
    case 'multitouchstart':
      eventHandler = this.multitouchStart;
      break;
    case 'multitouch':
      eventHandler = this.multitouch;
      break;
    case 'multitouchend':
      eventHandler = this.multitouchEnd;
      break;
    case 'pointerdown':
      eventHandler = this.pointerDown;
      break;
    case 'pointermove':
      eventHandler = this.pointerMove;
      break;
    case 'pointerup':
      eventHandler = this.pointerUp;
      break;
    case 'pointerover':
      eventHandler = this.pointerOver;
      break;
    case 'pointerout':
      eventHandler = this.pointerOut;
      break;
    case 'pointerleave':
      eventHandler = this.pointerLeave;
      break;
    case 'pointercancel':
      eventHandler = this.pointerCancel;
      break;
    default:
      break;
  }

  if (eventHandler) {
    eventHandler.call(this, event);
  }
}
