import { blobToJSON } from '../utils/binaryUtils.js';
import JSONToSketchData from './JSONToSketchData.js';
import semver from 'semver';

export default async function docToFile(db, doc, { image = false, sketch = false } = {}) {
  // NOTE doc.appVersion can be used to check in which version of the app the file was saved in
  const response = {
    name: doc.name,
    author: doc.author,
    id: doc._id,
    createdOn: doc.createdOn,
    updatedOn: doc.updatedOn
  };
  if (doc.class) response.class = doc.class;

  const { appVersion } = doc;

  const keys = [];
  if (sketch && semver.gt(appVersion, '0.0.4')) keys.push('sketch');

  if (keys.length > 0) await addAttachments(db, [doc], keys);

  if (sketch) {
    if (semver.gt(appVersion, '0.0.4')) {
      if (!(doc._attachments && doc._attachments.sketch && doc._attachments.sketch.data)) {
        throw new Error(`'${doc.name}' doesn't include sketch attachment`);
      }
      const data = await blobToJSON(doc._attachments.sketch.data);

      response.data = await JSONToSketchData(data);
    } else {
      const data = { data: doc.data, appVersion };
      response.data = await JSONToSketchData(data);
    }
  }
  if (image) {
    if (!(doc._attachments && doc._attachments.img && doc._attachments.img.data)) {
      throw new Error(`'${doc.name}' doesn't include image attachment`);
    }

    response.img = URL.createObjectURL(doc._attachments.img.data);
  }

  return response;
}

async function addAttachments(db, docs, keys) {
  if (keys) {
    keys = keys.reduce((obj, value) => {
      obj[value] = null;
      return obj;
    }, {});
  }

  const promises = [];

  for (const { _attachments: attachments, _id: id } of docs) {
    for (const attachmentId in keys || attachments) {
      const attachment = attachments[attachmentId];

      const promise = db.getAttachment(id, attachmentId).then(blob => {
        attachment.data = blob;
      });

      promises.push(promise);
    }
  }

  return await Promise.all(promises);
}
