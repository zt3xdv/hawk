var GetTilesWithin = require('./GetTilesWithin');
var CalculateFacesWithin = require('./CalculateFacesWithin');
var SetTileCollision = require('./SetTileCollision');

var Fill = function (index, tileX, tileY, width, height, recalculateFaces, layer)
{
    var doesIndexCollide = (layer.collideIndexes.indexOf(index) !== -1);

    var tiles = GetTilesWithin(tileX, tileY, width, height, null, layer);

    for (var i = 0; i < tiles.length; i++)
    {
        tiles[i].index = index;

        SetTileCollision(tiles[i], doesIndexCollide);
    }

    if (recalculateFaces)
    {

        CalculateFacesWithin(tileX - 1, tileY - 1, width + 2, height + 2, layer);
    }
};

module.exports = Fill;
