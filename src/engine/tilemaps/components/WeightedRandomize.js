var GetTilesWithin = require('./GetTilesWithin');
var MATH = require('../../math');

var WeightedRandomize = function (tileX, tileY, width, height, weightedIndexes, layer)
{
    if (!weightedIndexes) { return; }

    var i;
    var tiles = GetTilesWithin(tileX, tileY, width, height, null, layer);

    var weightTotal = 0;

    for (i = 0; i < weightedIndexes.length; i++)
    {
        weightTotal += weightedIndexes[i].weight;
    }

    if (weightTotal <= 0) { return; }

    for (i = 0; i < tiles.length; i++)
    {
        var rand = MATH.RND.frac() * weightTotal;
        var sum = 0;
        var randomIndex = -1;

        for (var j = 0; j < weightedIndexes.length; j++)
        {
            sum += weightedIndexes[j].weight;

            if (rand <= sum)
            {
                var chosen = weightedIndexes[j].index;

                randomIndex = Array.isArray(chosen)
                    ? chosen[Math.floor(MATH.RND.frac() * chosen.length)]
                    : chosen;
                break;
            }
        }

        tiles[i].index = randomIndex;
    }
};

module.exports = WeightedRandomize;
