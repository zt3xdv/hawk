var GetFastValue = require('../../utils/object/GetFastValue');

var GetTilesWithin = function (tileX, tileY, width, height, filteringOptions, layer)
{
    if (tileX === undefined) { tileX = 0; }
    if (tileY === undefined) { tileY = 0; }
    if (width === undefined) { width = layer.width; }
    if (height === undefined) { height = layer.height; }
    if (!filteringOptions) { filteringOptions = {}; }

    var isNotEmpty = GetFastValue(filteringOptions, 'isNotEmpty', false);
    var isColliding = GetFastValue(filteringOptions, 'isColliding', false);
    var hasInterestingFace = GetFastValue(filteringOptions, 'hasInterestingFace', false);

    if (tileX < 0)
    {
        width += tileX;
        tileX = 0;
    }

    if (tileY < 0)
    {
        height += tileY;
        tileY = 0;
    }

    if (tileX + width > layer.width)
    {
        width = Math.max(layer.width - tileX, 0);
    }

    if (tileY + height > layer.height)
    {
        height = Math.max(layer.height - tileY, 0);
    }

    var results = [];

    for (var ty = tileY; ty < tileY + height; ty++)
    {
        for (var tx = tileX; tx < tileX + width; tx++)
        {
            var tile = layer.data[ty][tx];

            if (tile !== null)
            {
                if (isNotEmpty && tile.index === -1)
                {
                    continue;
                }

                if (isColliding && !tile.collides)
                {
                    continue;
                }

                if (hasInterestingFace && !tile.hasInterestingFace)
                {
                    continue;
                }

                results.push(tile);
            }
        }
    }

    return results;
};

module.exports = GetTilesWithin;
