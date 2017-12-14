import * as THREE from 'three';
import { loadImage } from './imageUtils.js';
import createDebug from 'debug';
const debug = createDebug('d3d:threeUtils');

export function createTextureFromURL(url, useRGBAFormat = true) {
  const texture = new THREE.Texture();

  loadImage(url).then(image => {
    URL.revokeObjectURL(url);
    texture.format = useRGBAFormat ? THREE.RGBAFormat : THREE.RGBFormat;
    texture.image = image;
    texture.needsUpdate = true;
  }).catch(() => {
    URL.revokeObjectURL(url);
    throw new Error(`Unable to load image: '${url}'`);
  });

  return texture;
}

export function createTextureFromBlob(blob) {
  const texture = new THREE.Texture();

  const url = URL.createObjectURL(blob);
  loadImage(url).then(image => {
    URL.revokeObjectURL(url);

    texture.format = (blob.type === 'image/jpeg' || blob.type === 'image/jpg') ?
      THREE.RGBFormat :
      THREE.RGBAFormat;
    texture.image = image;
    texture.needsUpdate = true;
  }).catch(() => {
    URL.revokeObjectURL(url);

    throw new Error(`Unable to load image: '${url}'`);
  });

  return texture;
}

export class SpriteHandle extends THREE.Sprite {
  isUIHandle = true;
  constructor(texture, scale) {
    if (!texture.image) {
      debug('Error: Texture not loaded');
      super();
      return;
    }
    const spriteMaterial = new THREE.SpriteMaterial({
      color: 0xffffff,
      fog: true,
      depthTest: false,
      map: texture
    });
    super(spriteMaterial);
    const { width, height } = texture.image;
    this.scale.set(width * scale, height * scale, 1);
  }
}

export class CanvasPlane extends THREE.Mesh {
  constructor(width = 100, height = 100) {
    const planeGeometry = new THREE.PlaneBufferGeometry(0, 0, 1, 1);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const texture = new THREE.Texture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      depthTest: false,
      side: THREE.DoubleSide
    });

    super(planeGeometry, material);

    this._width = width;
    this._height = height;

    this._canvas = canvas;
    this._context = context;
    this._texture = texture;

    this.updateSize(width, height);
  }
  updateSize(width, height) {
    this._width = width;
    this._height = height;

    this._canvas.width = Math.round(width);
    this._canvas.height = Math.round(height);

    const positions = this.geometry.getAttribute('position');
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    positions.array[0] = -halfWidth;
    positions.array[1] = halfHeight;
    positions.array[3] = halfWidth;
    positions.array[4] = halfHeight;
    positions.array[6] = -halfWidth;
    positions.array[7] = -halfHeight;
    positions.array[9] = halfWidth;
    positions.array[10] = -halfHeight;
    positions.needsUpdate = true;
  }
  draw(draw) {
    draw(this._context, this._width, this._height);
    this._texture.needsUpdate = true;
  }
}
