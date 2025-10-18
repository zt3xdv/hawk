var WorldToTileXY = require('./WorldToTileXY');
var Vector2 = require('../../math/Vector2');

var tempVec = new Vector2();

var WorldToTileY = function (worldY, snapToFloor, camera, layer)
{
    WorldToTileXY(0, worldY, snapToFloor, tempVec, camera, layer);

    return tempVec.y;
};

module.exports = WorldToTileY;
