import { Text, Color } from '@doodle3d/cal';

export const dimensionsText = new Text({
  size: 16,
  family: 'monospace',
  fill: true,
  fillColor: new Color(0x000000),
  stroke: true,
  strokeWidth: 2,
  strokeColor: new Color(0xffffff),
  align: 'center',
  baseline: 'alphabetic'
});
