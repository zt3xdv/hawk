var GetTilesWithin = require('./GetTilesWithin');

var FindTile = function (callback, context, tileX, tileY, width, height, filteringOptions, layer)
{
    var tiles = GetTilesWithin(tileX, tileY, width, height, filteringOptions, layer);

    return tiles.find(callback, context) || null;
};

module.exports = FindTile;
