var Vector2 = require('../../math/Vector2');

var HexagonalTileToWorldXY = function (tileX, tileY, point, camera, layer)
{
    if (!point) { point = new Vector2(); }

    var tileWidth = layer.baseTileWidth;
    var tileHeight = layer.baseTileHeight;
    var tilemapLayer = layer.tilemapLayer;

    var worldX = 0;
    var worldY = 0;

    if (tilemapLayer)
    {
        if (!camera) { camera = tilemapLayer.scene.cameras.main; }

        worldX = tilemapLayer.x + camera.scrollX * (1 - tilemapLayer.scrollFactorX);
        worldY = tilemapLayer.y + camera.scrollY * (1 - tilemapLayer.scrollFactorY);

        tileWidth *= tilemapLayer.scaleX;
        tileHeight *= tilemapLayer.scaleY;
    }

    var tileWidthHalf = tileWidth / 2;
    var tileHeightHalf = tileHeight / 2;

    var x;
    var y;
    var staggerAxis = layer.staggerAxis;
    var staggerIndex = layer.staggerIndex;

    if (staggerAxis === 'y')
    {
        x = worldX + (tileWidth * tileX) + tileWidth;
        y = worldY + ((1.5 * tileY) * tileHeightHalf) + tileHeightHalf;

        if (tileY % 2 === 0)
        {
            if (staggerIndex === 'odd')
            {
                x -= tileWidthHalf;
            }
            else
            {
                x += tileWidthHalf;
            }
        }
    }
    else if ((staggerAxis === 'x') && (staggerIndex === 'odd'))
    {
        x = worldX + ((1.5 * tileX) * tileWidthHalf) + tileWidthHalf;
        y = worldY + (tileHeight * tileX) + tileHeight;

        if (tileX % 2 === 0)
        {
            if (staggerIndex === 'odd')
            {
                y -= tileHeightHalf;
            }
            else
            {
                y += tileHeightHalf;
            }
        }
    }

    return point.set(x, y);
};

module.exports = HexagonalTileToWorldXY;
