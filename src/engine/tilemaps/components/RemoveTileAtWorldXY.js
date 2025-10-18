var RemoveTileAt = require('./RemoveTileAt');
var Vector2 = require('../../math/Vector2');

var point = new Vector2();

var RemoveTileAtWorldXY = function (worldX, worldY, replaceWithNull, recalculateFaces, camera, layer)
{
    layer.tilemapLayer.worldToTileXY(worldX, worldY, true, point, camera, layer);

    return RemoveTileAt(point.x, point.y, replaceWithNull, recalculateFaces, layer);
};

module.exports = RemoveTileAtWorldXY;
