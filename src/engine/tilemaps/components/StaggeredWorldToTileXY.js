var Vector2 = require('../../math/Vector2');

var StaggeredWorldToTileXY = function (worldX, worldY, snapToFloor, point, camera, layer)
{
    if (!point) { point = new Vector2(); }

    var tileWidth = layer.baseTileWidth;
    var tileHeight = layer.baseTileHeight;
    var tilemapLayer = layer.tilemapLayer;

    if (tilemapLayer)
    {
        if (!camera) { camera = tilemapLayer.scene.cameras.main; }

        worldY = worldY - (tilemapLayer.y + camera.scrollY * (1 - tilemapLayer.scrollFactorY));

        tileHeight *= tilemapLayer.scaleY;

        worldX = worldX - (tilemapLayer.x + camera.scrollX * (1 - tilemapLayer.scrollFactorX));

        tileWidth *= tilemapLayer.scaleX;
    }

    var y = (snapToFloor) ? Math.floor((worldY / (tileHeight / 2))) : (worldY / (tileHeight / 2));
    var x = (snapToFloor) ? Math.floor((worldX + (y % 2) * 0.5 * tileWidth) / tileWidth) : (worldX + (y % 2) * 0.5 * tileWidth) / tileWidth;

    return point.set(x, y);
};

module.exports = StaggeredWorldToTileXY;
