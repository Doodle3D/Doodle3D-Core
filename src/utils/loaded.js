import { FONT_FACE } from '../constants/general.js';
import FontLoaded from 'font-loaded';
import { load as loadPattern } from '../d2/Shape.js';
import { load as loadMatcapMaterial } from '../d3/MatcapMaterial.js';

const loadFont = font => {
  const fontLoaded = new FontLoaded(font);
  return new Promise((resolve, reject) => {
    fontLoaded.on('load', resolve);
    fontLoaded.on('error', reject);
  });
};
export const loadFonts = Promise.all(Object.values(FONT_FACE).map(loadFont));

let loaded = false;
export const load = Promise.all([loadFonts, loadPattern, loadMatcapMaterial]).then(() => loaded = true);
export const isLoaded = () => loaded;
