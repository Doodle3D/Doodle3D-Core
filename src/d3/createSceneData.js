import shortid from 'shortid';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';

export default function docToShapeData(docData) {
  const sketchData = {
    spaces: {},
    objectsById: {}
  };

  for (let i = 0; i < docData.spaces.length; i ++) {
    const spaceData = docData.spaces[i];
    const space = i === 0 ? 'world' : shortid.generate();
    const objectIds = [];

    for (const object of spaceData.objects) {
      const UID = shortid.generate();
      objectIds.push(UID);
      const { defaultProperties } = SHAPE_TYPE_PROPERTIES[object.type];
      sketchData.objectsById[UID] = { ...defaultProperties, ...object, UID, space };
    }

    sketchData.spaces[space] = {
      matrix: spaceData.matrix,
      objectIds
    };
  }

  return sketchData;
}
