import { loadImage, prepareImage } from './imageUtils.js';
import { Vector } from '@doodle3d/cal';

// BINARY BUFFER < - > BASE64
export function bufferToBase64(buffer) {
  const arrayBuffer = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < arrayBuffer.length; i ++) {
    binaryString += String.fromCharCode(arrayBuffer[i]);
  }
  return btoa(binaryString);
}

export function base64ToBuffer(base64) {
  const binaryString = atob(base64);
  const arrayBuffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i ++) {
    arrayBuffer[i] = binaryString.charCodeAt(i);
  }
  return arrayBuffer.buffer;
}

// BLOB < - > JSON
export async function blobToJSON(blob) {
  const url = URL.createObjectURL(blob);
  const json = await fetch(url).then(response => response.json());
  URL.revokeObjectURL(url);

  return json;
}

export function JSONToBlob(json) {
  const jsonString = JSON.stringify(json);
  const blob = new Blob([jsonString], { type: 'aplication/json' });

  return blob;
}

// HTML IMAGE < - > BASE64
export function imageToBase64(image) {
  const imageData = image.toDataURL('image/jpeg');

  return {
    metadata: { type: 'Image' },
    data: imageData
  };
}

export function base64ToImage({ data }) {
  return loadImage(data).then(prepareImage);
}

// VECTOR ARRAY < - > BASE64
export function base64ToVectorArray({ data: base64, metadata: { size } }) {
  const buffer = base64ToBuffer(base64);

  let flatArray;
  switch (size) {
    case 'Float32':
      flatArray = new Float32Array(buffer);
      break;
    case 'Float64':
      flatArray = new Float64Array(buffer);
      break;
    default:
      break;
  }

  const vectorArray = [];
  for (let i = 0; i < flatArray.length; i += 2) {
    const x = flatArray[i];
    const y = flatArray[i + 1];
    vectorArray.push(new Vector(x, y));
  }
  return vectorArray;
}

export function vectorArrayToBase64(vectorArray) {
  const flatArray = vectorArray.reduce((array, { x, y }) => {
    array.push(x, y);
    return array;
  }, []);

  const typedArray = new Float32Array(flatArray);
  const base64String = bufferToBase64(typedArray.buffer);

  return {
    metadata: { type: 'VectorArray', size: 'Float32' },
    data: base64String
  };
}
