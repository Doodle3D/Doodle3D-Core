import { IMAGE_GUIDE_TRANSPARENCY, DESELECT_TRANSPARENCY } from '../constants/d2Constants.js';
import { Surface } from '@doodle3d/cal';

export default class ImageShape extends Surface {
  constructor(shapeData) {
    super();

    this.depth = -1;
    this.UID = shapeData.UID;

    this.update(shapeData);
    this.setOpaque(true);
  }
  update(newShapeData) {
    let changed;

    if (!this._shapeData || this._shapeData.transform !== newShapeData.transform) {
      changed = true;
      this.copyMatrix(newShapeData.transform);
    }

    if (!this._shapeData || this._shapeData.imageData !== newShapeData.imageData) {
      changed = true;

      const newImage = newShapeData.imageData;
      const image = this._shapeData ? this._shapeData.imageData : {};

      if (newImage.width !== image.width || newImage.height !== image.height) {
        this.setSize(newImage.width, newImage.height);
        this.centerX = newImage.width / 2;
        this.centerY = newImage.height / 2;
      }

      this.context.drawImage(newImage, 0, 0, newImage.width, newImage.height);
    }

    this._shapeData = newShapeData;
    return changed;
  }
  setOpaque(opaque) {
    this.alpha = opaque ? IMAGE_GUIDE_TRANSPARENCY : DESELECT_TRANSPARENCY;
  }
}
