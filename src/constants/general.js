import * as contextTools from './contextTools.js';

export const VERSION = '0.23.0';
export const SHAPE_CACHE_LIMIT = 50;
export const PIXEL_RATIO = 1.0;

export const COLOR_STRING_TO_HEX = {
  [contextTools.LIGHT_BLUE_A]: 0xBCFFFF,
  [contextTools.LIGHT_BLUE_B]: 0x68E1FD,
  [contextTools.LIGHT_BLUE_C]: 0x01B8FF,

  [contextTools.DARK_BLUE_A]: 0xC8E3FF,
  [contextTools.DARK_BLUE_B]: 0x7DACFC,
  [contextTools.DARK_BLUE_C]: 0x0256FF,

  [contextTools.PURPLE_A]: 0xEFC9FF,
  [contextTools.PURPLE_B]: 0xC57EFC,
  [contextTools.PURPLE_C]: 0x820FF9,

  [contextTools.PINK_A]: 0xFFC7EE,
  [contextTools.PINK_B]: 0xFD7BC1,
  [contextTools.PINK_C]: 0xFA047B,

  [contextTools.RED_A]: 0xFFCDCE,
  [contextTools.RED_B]: 0xFD898A,
  [contextTools.RED_C]: 0xFF2600,

  [contextTools.YELLOW_A]: 0xFFF76B,
  [contextTools.YELLOW_B]: 0xFF9201,
  [contextTools.YELLOW_C]: 0xAA7942,

  [contextTools.GREEN_A]: 0xDAFFD5,
  [contextTools.GREEN_B]: 0x97F294,
  [contextTools.GREEN_C]: 0x00EA01,

  [contextTools.BLACK_A]: 0xF4F4F4,
  [contextTools.BLACK_B]: 0xAAAAAA,
  [contextTools.BLACK_C]: 0x444444
};

export const FONT_FACE = {
  [contextTools.OSWALD]: 'Oswald',
  [contextTools.RANGA]: 'Ranga',
  [contextTools.JOTI_ONE]: 'Joti One',
  [contextTools.BELLEFAIR]: 'Bellefair',
  [contextTools.LOBSTER]: 'Lobster',
  [contextTools.ABRIL_FATFACE]: 'Abril Fatface',
  [contextTools.PLAY]: 'Play',
  [contextTools.FASCINATE]: 'Fascinate'
};
