var CalculateFacesWithin = require('./CalculateFacesWithin');
var PutTileAt = require('./PutTileAt');

var PutTilesAt = function (tilesArray, tileX, tileY, recalculateFaces, layer)
{
    if (recalculateFaces === undefined) { recalculateFaces = true; }

    if (!Array.isArray(tilesArray))
    {
        return null;
    }

    if (!Array.isArray(tilesArray[0]))
    {
        tilesArray = [ tilesArray ];
    }

    var height = tilesArray.length;
    var width = tilesArray[0].length;

    for (var ty = 0; ty < height; ty++)
    {
        for (var tx = 0; tx < width; tx++)
        {
            var tile = tilesArray[ty][tx];

            PutTileAt(tile, tileX + tx, tileY + ty, false, layer);
        }
    }

    if (recalculateFaces)
    {

        CalculateFacesWithin(tileX - 1, tileY - 1, width + 2, height + 2, layer);
    }
};

module.exports = PutTilesAt;
