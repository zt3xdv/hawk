var GameObjectFactory = require('../gameobjects/GameObjectFactory');
var ParseToTilemap = require('./ParseToTilemap');

GameObjectFactory.register('tilemap', function (key, tileWidth, tileHeight, width, height, data, insertNull)
{

    if (key === null) { key = undefined; }
    if (tileWidth === null) { tileWidth = undefined; }
    if (tileHeight === null) { tileHeight = undefined; }
    if (width === null) { width = undefined; }
    if (height === null) { height = undefined; }

    return ParseToTilemap(this.scene, key, tileWidth, tileHeight, width, height, data, insertNull);
});
