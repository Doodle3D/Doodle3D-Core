import * as contextTools from './contextTools.js';

export const VERSION = '0.16.6';
export const SHAPE_CACHE_LIMIT = 50;
export const PIXEL_RATIO = 1.0;

export const COLOR_STRING_TO_HEX = {
  [contextTools.LIGHT_BLUE]: 0xc8e4f7,
  [contextTools.LIGHT_GREEN]: 0xcbe6c0,
  [contextTools.LIGHT_PINK]: 0xf8c4d8,
  [contextTools.LIGHT_YELLOW]: 0xf5f5c0,
  [contextTools.BLUE]: 0x92c8ef,
  [contextTools.GREEN]: 0x99cc81,
  [contextTools.PINK]: 0xf28bb1,
  [contextTools.YELLOW]: 0xebea7f,
  [contextTools.DARK_BLUE]: 0x50a8e4,
  [contextTools.DARK_GREEN]: 0x5aae31,
  [contextTools.DARK_PINK]: 0xe94481,
  [contextTools.DARK_YELLOW]: 0xdfde24
};
export const COLOR_HEX_TO_STRING = Object
  .entries(COLOR_STRING_TO_HEX)
  .reduce((obj, [key, value]) => {
    obj[value] = key;
    return obj;
  }, {});

// LEGACY
// add old color codes to corresponding color strings
// so old doodles with old colors are previewd correctly in color picker color selector
COLOR_HEX_TO_STRING[0x96cbef] = contextTools.BLUE;
COLOR_HEX_TO_STRING[0x9bca87] = contextTools.GREEN;
COLOR_HEX_TO_STRING[0xf08eb2] = contextTools.PINK;
COLOR_HEX_TO_STRING[0xfff59a] = contextTools.YELLOW;
COLOR_HEX_TO_STRING[0x7098b3] = contextTools.DARK_BLUE;
COLOR_HEX_TO_STRING[0x7ab063] = contextTools.DARK_GREEN;
COLOR_HEX_TO_STRING[0xb36984] = contextTools.DARK_PINK;
COLOR_HEX_TO_STRING[0xf5e872] = contextTools.DARK_YELLOW;
COLOR_HEX_TO_STRING[0x00DDFF] = contextTools.BLUE;
