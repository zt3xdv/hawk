var CreatePixelPerfectHandler = function (textureManager, alphaTolerance) {
  return function (hitArea, x, y, gameObject) {
    var alpha = textureManager.getPixelAlpha(
      x,
      y,
      gameObject.texture.key,
      gameObject.frame.name,
    );
    return alpha && alpha >= alphaTolerance;
  };
};
module.exports = CreatePixelPerfectHandler;
