import shortid from 'shortid';
import { SHAPE_TYPE_PROPERTIES } from '../constants/shapeTypeProperties.js';
import { load } from '../utils/loaded.js';

export default async function createSceneData(docData) {
  await load;

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
