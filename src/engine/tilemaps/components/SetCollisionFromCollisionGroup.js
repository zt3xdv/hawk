var SetTileCollision = require('./SetTileCollision');
var CalculateFacesWithin = require('./CalculateFacesWithin');

var SetCollisionFromCollisionGroup = function (collides, recalculateFaces, layer)
{
    if (collides === undefined) { collides = true; }
    if (recalculateFaces === undefined) { recalculateFaces = true; }

    for (var ty = 0; ty < layer.height; ty++)
    {
        for (var tx = 0; tx < layer.width; tx++)
        {
            var tile = layer.data[ty][tx];

            if (!tile) { continue; }

            var collisionGroup = tile.getCollisionGroup();

            if (collisionGroup && collisionGroup.objects && collisionGroup.objects.length > 0)
            {
                SetTileCollision(tile, collides);
            }
        }
    }

    if (recalculateFaces)
    {
        CalculateFacesWithin(0, 0, layer.width, layer.height, layer);
    }
};

module.exports = SetCollisionFromCollisionGroup;
