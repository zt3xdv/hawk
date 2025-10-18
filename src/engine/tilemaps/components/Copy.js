var CalculateFacesWithin = require('./CalculateFacesWithin');
var GetTilesWithin = require('./GetTilesWithin');
var IsInLayerBounds = require('./IsInLayerBounds');
var Tile = require('../Tile');

var Copy = function (srcTileX, srcTileY, width, height, destTileX, destTileY, recalculateFaces, layer)
{
    if (recalculateFaces === undefined) { recalculateFaces = true; }

    var srcTiles = GetTilesWithin(srcTileX, srcTileY, width, height, null, layer);

    var copyTiles = [];

    srcTiles.forEach(function (tile)
    {
        var newTile = new Tile(
            tile.layer,
            tile.index,
            tile.x,
            tile.y,
            tile.width,
            tile.height,
            tile.baseWidth,
            tile.baseHeight
        );

        newTile.copy(tile);

        copyTiles.push(newTile);
    });

    var offsetX = destTileX - srcTileX;
    var offsetY = destTileY - srcTileY;

    for (var i = 0; i < copyTiles.length; i++)
    {
        var copy = copyTiles[i];
        var tileX = copy.x + offsetX;
        var tileY = copy.y + offsetY;

        if (IsInLayerBounds(tileX, tileY, layer))
        {
            if (layer.data[tileY][tileX])
            {
                copy.x = tileX;
                copy.y = tileY;
                copy.updatePixelXY();

                layer.data[tileY][tileX] = copy;
            }
        }
    }

    if (recalculateFaces)
    {

        CalculateFacesWithin(destTileX - 1, destTileY - 1, width + 2, height + 2, layer);
    }

    srcTiles.length = 0;
    copyTiles.length = 0;
};

module.exports = Copy;
