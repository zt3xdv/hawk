export default class TextureExtractor {
  static getTexture(scene, imageId, x, y, width, height) {
    const texture = scene.textures.get(imageId);
    if (!texture) {
      throw new Error(`Texture not found with id ${imageId}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      texture.source[0].image,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height
    );

    return canvas.toDataURL();
  }
}