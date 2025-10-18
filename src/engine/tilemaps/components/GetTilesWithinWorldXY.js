var GetTilesWithin = require('./GetTilesWithin');
var Vector2 = require('../../math/Vector2');

var pointStart = new Vector2();
var pointEnd = new Vector2();

var GetTilesWithinWorldXY = function (worldX, worldY, width, height, filteringOptions, camera, layer)
{
    var worldToTileXY = layer.tilemapLayer.tilemap._convert.WorldToTileXY;

    worldToTileXY(worldX, worldY, true, pointStart, camera, layer);

    var xStart = pointStart.x;
    var yStart = pointStart.y;

    worldToTileXY(worldX + width, worldY + height, false, pointEnd, camera, layer);

    var xEnd = Math.ceil(pointEnd.x);
    var yEnd = Math.ceil(pointEnd.y);

    return GetTilesWithin(xStart, yStart, xEnd - xStart, yEnd - yStart, filteringOptions, layer);
};

module.exports = GetTilesWithinWorldXY;
