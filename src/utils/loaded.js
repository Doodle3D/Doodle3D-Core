import { FONT_FACE } from '../constants/general.js';
import * as contextTools from '../constants/contextTools.js';
import FontLoaded from 'font-loaded';
import { load as loadPattern } from '../d2/Shape.js';
import { load as loadMatcapMaterial } from '../d3/MatcapMaterial.js';
import jss from 'jss';
import abril_url from '../../fonts/abril-fatface-v12-latin-regular.woff';
import bellefair_url from '../../fonts/bellefair-v6-latin-regular.woff';
import fascinate_url from '../../fonts/fascinate-v11-latin-regular.woff';
import joti_url from '../../fonts/joti-one-v11-latin-regular.woff';
import lobster_url from '../../fonts/lobster-v23-latin-regular.woff';
import oswald_url from '../../fonts/oswald-v36-latin-regular.woff';
import play_url from '../../fonts/play-v12-latin-regular.woff';
import ranga_url from '../../fonts/ranga-v8-latin-regular.woff';

const fontFaces = [
  { url: abril_url,     family: FONT_FACE[contextTools.ABRIL_FATFACE], },
  { url: bellefair_url, family: FONT_FACE[contextTools.BELLEFAIR], },
  { url: fascinate_url, family: FONT_FACE[contextTools.FASCINATE], },
  { url: joti_url,      family: FONT_FACE[contextTools.JOTI_ONE], },
  { url: lobster_url,   family: FONT_FACE[contextTools.LOBSTER], },
  { url: oswald_url,    family: FONT_FACE[contextTools.OSWALD], },
  { url: play_url,      family: FONT_FACE[contextTools.PLAY], },
  { url: ranga_url,     family: FONT_FACE[contextTools.RANGA], },
];

jss.createStyleSheet({
    '@font-face': fontFaces.map(({ url, family }) => ({
        'font-family': family,
        'src': `url("${url}") format("woff")`
    })),
}).attach();

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
