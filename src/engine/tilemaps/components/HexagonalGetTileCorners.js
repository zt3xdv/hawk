var HexagonalTileToWorldXY = require('./HexagonalTileToWorldXY');
var Vector2 = require('../../math/Vector2');

var tempVec = new Vector2();

var HexagonalGetTileCorners = function (tileX, tileY, camera, layer)
{
    var tileWidth = layer.baseTileWidth;
    var tileHeight = layer.baseTileHeight;
    var tilemapLayer = layer.tilemapLayer;

    if (tilemapLayer)
    {
        tileWidth *= tilemapLayer.scaleX;
        tileHeight *= tilemapLayer.scaleY;
    }

    var center = HexagonalTileToWorldXY(tileX, tileY, tempVec, camera, layer);

    var corners = [];

    var b0 = 0.5773502691896257; 

    var hexWidth;
    var hexHeight;

    if (layer.staggerAxis === 'y')
    {
        hexWidth = b0 * tileWidth;
        hexHeight = tileHeight / 2;
    }
    else
    {
        hexWidth = tileWidth / 2;
        hexHeight = b0 * tileHeight;
    }

    for (var i = 0; i < 6; i++)
    {
        var angle = 2 * Math.PI * (0.5 - i) / 6;

        corners.push(new Vector2(center.x + (hexWidth * Math.cos(angle)), center.y + (hexHeight * Math.sin(angle))));
    }

    return corners;
};

module.exports = HexagonalGetTileCorners;
