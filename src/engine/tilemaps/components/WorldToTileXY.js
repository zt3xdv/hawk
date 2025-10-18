var Vector2 = require('../../math/Vector2');

var WorldToTileXY = function (worldX, worldY, snapToFloor, point, camera, layer)
{
    if (snapToFloor === undefined) { snapToFloor = true; }
    if (!point) { point = new Vector2(); }

    var tileWidth = layer.baseTileWidth;
    var tileHeight = layer.baseTileHeight;
    var tilemapLayer = layer.tilemapLayer;

    if (tilemapLayer)
    {
        if (!camera) { camera = tilemapLayer.scene.cameras.main; }

        worldX = worldX - (tilemapLayer.x + camera.scrollX * (1 - tilemapLayer.scrollFactorX));
        worldY = worldY - (tilemapLayer.y + camera.scrollY * (1 - tilemapLayer.scrollFactorY));

        tileWidth *= tilemapLayer.scaleX;
        tileHeight *= tilemapLayer.scaleY;
    }

    var x = worldX / tileWidth;
    var y = worldY / tileHeight;

    if (snapToFloor)
    {
        x = Math.floor(x);
        y = Math.floor(y);
    }

    return point.set(x, y);
};

module.exports = WorldToTileXY;
