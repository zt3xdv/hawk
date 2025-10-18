var TileToWorldX = require('./TileToWorldX');
var TileToWorldY = require('./TileToWorldY');
var Vector2 = require('../../math/Vector2');

var TileToWorldXY = function (tileX, tileY, point, camera, layer)
{
    if (!point) { point = new Vector2(0, 0); }

    point.x = TileToWorldX(tileX, camera, layer);
    point.y = TileToWorldY(tileY, camera, layer);

    return point;
};

module.exports = TileToWorldXY;
