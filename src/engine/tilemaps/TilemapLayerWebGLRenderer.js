var Utils = require('../renderer/webgl/Utils');
var TilemapLayerWebGLRenderer = function (renderer, src, camera) {
  var renderTiles = src.cull(camera);
  var tileCount = renderTiles.length;
  var alpha = camera.alpha * src.alpha;
  if (tileCount === 0 || alpha <= 0) {
    return;
  }
  var gidMap = src.gidMap;
  var pipeline = renderer.pipelines.set(src.pipeline, src);
  var getTint = Utils.getTintAppendFloatAlpha;
  var scrollFactorX = src.scrollFactorX;
  var scrollFactorY = src.scrollFactorY;
  var x = src.x;
  var y = src.y;
  var sx = src.scaleX;
  var sy = src.scaleY;
  renderer.pipelines.preBatch(src);
  for (var i = 0; i < tileCount; i++) {
    var tile = renderTiles[i];
    var tileset = gidMap[tile.index];
    if (!tileset) {
      continue;
    }
    var tileTexCoords = tileset.getTileTextureCoordinates(tile.index);
    var tileWidth = tileset.tileWidth;
    var tileHeight = tileset.tileHeight;
    if (!tileTexCoords || tileWidth === 0 || tileHeight === 0) {
      continue;
    }
    var halfWidth = tileWidth * 0.5;
    var halfHeight = tileHeight * 0.5;
    var texture = tileset.glTexture;
    var textureUnit = pipeline.setTexture2D(texture, src);
    var frameWidth = tileWidth;
    var frameHeight = tileHeight;
    var frameX = tileTexCoords.x;
    var frameY = tileTexCoords.y;
    var tOffsetX = tileset.tileOffset.x;
    var tOffsetY = tileset.tileOffset.y;
    var tint = getTint(tile.tint, alpha * tile.alpha);
    pipeline.batchTexture(
      src,
      texture,
      texture.width,
      texture.height,
      x + tile.pixelX * sx + (halfWidth * sx - tOffsetX),
      y + tile.pixelY * sy + (halfHeight * sy - tOffsetY),
      tileWidth,
      tileHeight,
      sx,
      sy,
      tile.rotation,
      tile.flipX,
      tile.flipY,
      scrollFactorX,
      scrollFactorY,
      halfWidth,
      halfHeight,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      tint,
      tint,
      tint,
      tint,
      tile.tintFill,
      0,
      0,
      camera,
      null,
      true,
      textureUnit,
      true,
    );
  }
  renderer.pipelines.postBatch(src);
};
module.exports = TilemapLayerWebGLRenderer;
