var GetTilesWithin = require('./GetTilesWithin');
var GetRandom = require('../../utils/array/GetRandom');

var Randomize = function (tileX, tileY, width, height, indexes, layer)
{
    var i;
    var tiles = GetTilesWithin(tileX, tileY, width, height, {}, layer);

    if (!indexes)
    {
        indexes = [];

        for (i = 0; i < tiles.length; i++)
        {
            if (indexes.indexOf(tiles[i].index) === -1)
            {
                indexes.push(tiles[i].index);
            }
        }
    }

    for (i = 0; i < tiles.length; i++)
    {
        tiles[i].index = GetRandom(indexes);
    }
};

module.exports = Randomize;
