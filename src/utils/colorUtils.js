import * as THREE from 'three';

export function getPixelHue(imageData, index) {
  const { data } = imageData;

  const i = index * 4;

  const red = data[i];
  const green = data[i + 1];
  const blue = data[i + 2];

  const min = Math.min(red, green, blue);
  const max = Math.max(red, green, blue);

  let hue;
  if (max === red) {
    hue = (green - blue) / (max - min);
  } else if (max === green) {
    hue = 2.0 + (blue - red) / (max - min);
  } else {
    hue = 4.0 + (red - green) / (max - min);
  }

  hue *= 60.0;
  if (hue < 0) hue += 360.0;

  return hue;
}

export function getPixelBrightness(imageData, index) {
  const { data } = imageData;

  const i = index * 4;

  const red = data[i];
  const green = data[i + 1];
  const blue = data[i + 2];

  return red * 0.2989 + green * 0.5870 + blue * 0.1140;
}

export function getPixel(imageData, index) {
  const { data } = imageData;

  const i = index * 4;

  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2]
  };
}

const TEMP_COLOR = new THREE.Color();
export const hexToStyle = (hex) => TEMP_COLOR.setHex(hex).getStyle();
