import { vectorArrayToBase64, imageToBase64 } from '../utils/binaryUtils.js';
import { VERSION } from '../constants/general.js';

function createShapeData(shape) {
  shape = { ...shape };
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


export default function sketchDataToJSON({ objectsById, spaces }) {
  const mapToShapes = id => objectsById[id];
  const filter = (shape) => {
    if (shape.type === 'IMAGE_GUIDE') return false;
    return true;
  };

  const data = {
    spaces: []
  };

  for (const spaceId in spaces) {
    const space = {
      matrix: {
        metadata: { type: 'Matrix4', library: 'three.js' },
        elements: Array.from(spaces[spaceId].matrix.elements)
      },
      objects: spaces[spaceId].objectIds.map(mapToShapes).filter(filter).map(createShapeData)
    };

    if (spaceId === 'world') {
      data.spaces.unshift(space);
    } else {
      data.spaces.push(space);
    }
  }

  return { data, appVersion: VERSION };
}
