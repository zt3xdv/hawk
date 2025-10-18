var SetTileCollision = require('./SetTileCollision');
var CalculateFacesWithin = require('./CalculateFacesWithin');
var SetLayerCollisionIndex = require('./SetLayerCollisionIndex');

var SetCollisionBetween = function (start, stop, collides, recalculateFaces, layer, updateLayer)
{
    if (collides === undefined) { collides = true; }
    if (recalculateFaces === undefined) { recalculateFaces = true; }
    if (updateLayer === undefined) { updateLayer = true; }

    if (start > stop)
    {
        return;
    }

    for (var index = start; index <= stop; index++)
    {
        SetLayerCollisionIndex(index, collides, layer);
    }

    if (updateLayer)
    {
        for (var ty = 0; ty < layer.height; ty++)
        {
            for (var tx = 0; tx < layer.width; tx++)
            {
                var tile = layer.data[ty][tx];

                if (tile)
                {
                    if (tile.index >= start && tile.index <= stop)
                    {
                        SetTileCollision(tile, collides);
                    }
                }
            }
        }
    }

    if (recalculateFaces)
    {
        CalculateFacesWithin(0, 0, layer.width, layer.height, layer);
    }
};

module.exports = SetCollisionBetween;
