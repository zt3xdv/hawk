var GetTilesWithin = require('./GetTilesWithin');

var FilterTiles = function (callback, context, tileX, tileY, width, height, filteringOptions, layer)
{
    var tiles = GetTilesWithin(tileX, tileY, width, height, filteringOptions, layer);

    return tiles.filter(callback, context);
};

module.exports = FilterTiles;
