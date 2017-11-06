import { vectorArrayToBase64, imageToBase64 } from '../utils/binaryUtils.js';
import { VERSION } from '../constants/general.js';

export default function sketchDataToJSON({ objectsById, spaces }) {
  const data = {
    spaces: []
  };

  function createShapeData(id) {
    const shape = { ...objectsById[id] };
    delete shape.UID;
    delete shape.space;

    switch (shape.type) {
      case 'POLYGON':
      case 'BRUSH':
      case 'FREE_HAND': {
        shape.points = vectorArrayToBase64(shape.points);
        break;
      }

      case 'COMPOUND_PATH': {
        shape.points = vectorArrayToBase64(shape.points);
        shape.holes = shape.holes.map(vectorArrayToBase64);
        break;
      }

      case 'IMAGE_GUIDE': {
        shape.imageData = imageToBase64(shape.imageData);
        break;
      }

      default: {
        break;
      }
    }
    return shape;
  }

  for (const spaceId in spaces) {
    const space = {
      matrix: {
        metadata: { type: 'Matrix4', library: 'three.js' },
        elements: Array.from(spaces[spaceId].matrix.elements)
      },
      objects: spaces[spaceId].objectIds.map(createShapeData)
    };

    if (spaceId === 'world') {
      data.spaces.unshift(space);
    } else {
      data.spaces.push(space);
    }
  }

  return {
    data: JSON.stringify(data),
    appVersion: VERSION
  };
}
