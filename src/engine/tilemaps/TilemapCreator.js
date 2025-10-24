var GameObjectCreator = require('../gameobjects/GameObjectCreator');
var ParseToTilemap = require('./ParseToTilemap');
GameObjectCreator.register('tilemap', function (config) {
  var c = config !== undefined ? config : {};
  return ParseToTilemap(
    this.scene,
    c.key,
    c.tileWidth,
    c.tileHeight,
    c.width,
    c.height,
    c.data,
    c.insertNull,
  );
});
