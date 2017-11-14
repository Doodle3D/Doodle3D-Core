import { MAX_IMAGE_SIZE } from '../constants/d2Constants.js';

export function prepareImage(image) {
  let { width, height } = image;

  const maxImageSize = Math.max(width, height);
  if (maxImageSize > MAX_IMAGE_SIZE) {
    const scale = MAX_IMAGE_SIZE / maxImageSize;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = reject;
    image.src = src;
  });
}
