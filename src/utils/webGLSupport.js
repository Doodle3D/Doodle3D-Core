export const TOON_SHADER_PREVIEW_EXTENSIONS = ['OES_texture_float_linear'];
export const TOON_SHADER_THUMBNAIL_EXTENSIONS = [];

export const isWebGLAvailable = (() => {
  const canvas = document.createElement('canvas');

  if (!window.WebGLRenderingContext) return false;

  const webglContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return Boolean(webglContext);
})();

export const supportedExtensions = (() => {
  if (!isWebGLAvailable) return [];

  const canvas = document.createElement('canvas');

  const webglContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return webglContext.getSupportedExtensions();
})();

export const hasExtensionsFor = ((object) => {
  const enabled = {};
  loop: for (const key in object) {
    if (!isWebGLAvailable) {
      enabled[key] = false;
      continue loop;
    }

    const neededExtensions = object[key];

    for (const neededExtension of neededExtensions) {
      if (supportedExtensions.indexOf(neededExtension) === -1) {
        enabled[key] = false;
        continue loop;
      }
    }

    enabled[key] = true;
  }

  return enabled;
})({
  toonShaderPreview: TOON_SHADER_PREVIEW_EXTENSIONS,
  toonShaderThumbnail: TOON_SHADER_THUMBNAIL_EXTENSIONS
});
