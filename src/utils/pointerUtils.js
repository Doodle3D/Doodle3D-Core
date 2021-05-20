import { Vector } from '@doodle3d/cal';

export function convertEvent(DOMNode, event) {
  const { left, top } = DOMNode.getBoundingClientRect();
  return new Vector(event.clientX - left, event.clientY - top);
}

export function isMouseEvent(event) {
  // Multitouch events can be ignored because they cannot be triggered by a mouse
  return event.event && event.event.pointerType === 'mouse';
}
