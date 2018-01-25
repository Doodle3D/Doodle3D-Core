import * as THREE from 'three';
import ShapesManager from './ShapesManager.js';
import RenderChain, { TOONSHADER, TOONSHADER_OUTLINE } from './RenderChain.js';
import { hasExtensionsFor } from '../utils/webGLSupport.js';
import { CANVAS_SIZE } from '../constants/d2Constants.js';

const CANVAS_WIDTH = CANVAS_SIZE * 2;
const CANVAS_HEIGHT = CANVAS_SIZE * 2;

export default function createScene(state, canvas) {
  const scene = new THREE.Scene();

  // Position and zoom of the camera should be stored in constants
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
  camera.position.set(0, 200, 150);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  scene.add(camera);

  const shapesManager = new ShapesManager();
  shapesManager.update(state);

  scene.add(shapesManager);

  const geometry = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
  const material = new THREE.MeshBasicMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = Math.PI / 2;
  plane.position.y = -0.1;
  plane.name = 'bed-plane';
  scene.add(plane);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

  const shader = hasExtensionsFor.toonShaderThumbnail ? TOONSHADER_OUTLINE : TOONSHADER;
  const renderChain = new RenderChain(renderer, scene, camera, shader, {
    plane,
    UI: new THREE.Object3D(),
    shapes: shapesManager,
    boundingBox: new THREE.Object3D()
  });
  const setSize = renderChain.setSize.bind(renderChain);
  const render = renderChain.render.bind(renderChain);

  return { scene, camera, renderer, render, setSize };
}
