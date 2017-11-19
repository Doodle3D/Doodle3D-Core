export const SCULPT_LIMIT = 0.6;
export const DESELECT_TRANSPARENCY = 0.2;
export const MIN_CAMERA_ZOOM = 10;
export const MAX_CAMERA_ZOOM = 600;
export const MAX_CAMERA_PAN = 150;
// Legacy compensation. Compensating for the fact that we
// used to devide the twist by the fixed sculpt steps.
// TODO: move this to twist factor in interface
// and converting old files on open once
export const LEGACY_HEIGHT_STEP = 10;
export const MAX_ANGLE = 30; // if shape has an corner sharper then MAX_ANGLE said corner will be sharp
