import 'blueimp-canvas-to-blob'; // canvas toBlob polyfill
import createScene from '../d3/createScene.js';
import { IMAGE_TYPE, IMAGE_QUALITY } from '../constants/saveConstants.js';
import { load } from '../utils/loaded.js';

export function generateThumb(state, width, height, responseType = 'blob') {
  return new Promise(async (resolve) => {
    await load;

    const { render, renderer, setSize } = createScene(state);

    setSize(width, height, 1.0);
    render();

    // possible to add encoder options for smaller file setSize
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
    switch (responseType) {
      case 'base64':
        const base64 = renderer.domElement.toDataURL(IMAGE_TYPE, IMAGE_QUALITY);
        resolve(base64);
        break;

      case 'objectURL':
        renderer.domElement.toCanvas((blob) => {
          const objectURL = URL.createObjectURL(blob);
          resolve(objectURL);
        }, IMAGE_TYPE, IMAGE_QUALITY);
        break;

      default:
        renderer.domElement.toBlob((blob) => {
          resolve(blob);
        }, IMAGE_TYPE, IMAGE_QUALITY);
        break;
    }
  });
}
