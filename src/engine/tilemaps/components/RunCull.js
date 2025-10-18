var RunCull = function (layer, bounds, renderOrder, outputArray)
{
    var mapData = layer.data;
    var mapWidth = layer.width;
    var mapHeight = layer.height;

    var tilemapLayer = layer.tilemapLayer;

    var drawLeft = Math.max(0, bounds.left);
    var drawRight = Math.min(mapWidth, bounds.right);
    var drawTop = Math.max(0, bounds.top);
    var drawBottom = Math.min(mapHeight, bounds.bottom);

    var x;
    var y;
    var tile;

    if (renderOrder === 0)
    {

        for (y = drawTop; y < drawBottom; y++)
        {
            for (x = drawLeft; mapData[y] && x < drawRight; x++)
            {
                tile = mapData[y][x];

                if (!tile || tile.index === -1 || !tile.visible || tile.alpha === 0)
                {
                    continue;
                }

                outputArray.push(tile);
            }
        }
    }
    else if (renderOrder === 1)
    {

        for (y = drawTop; y < drawBottom; y++)
        {
            for (x = drawRight; mapData[y] && x >= drawLeft; x--)
            {
                tile = mapData[y][x];

                if (!tile || tile.index === -1 || !tile.visible || tile.alpha === 0)
                {
                    continue;
                }

                outputArray.push(tile);
            }
        }
    }
    else if (renderOrder === 2)
    {

        for (y = drawBottom; y >= drawTop; y--)
        {
            for (x = drawLeft; mapData[y] && x < drawRight; x++)
            {
                tile = mapData[y][x];

                if (!tile || tile.index === -1 || !tile.visible || tile.alpha === 0)
                {
                    continue;
                }

                outputArray.push(tile);
            }
        }
    }
    else if (renderOrder === 3)
    {

        for (y = drawBottom; y >= drawTop; y--)
        {
            for (x = drawRight; mapData[y] && x >= drawLeft; x--)
            {
                tile = mapData[y][x];

                if (!tile || tile.index === -1 || !tile.visible || tile.alpha === 0)
                {
                    continue;
                }

                outputArray.push(tile);
            }
        }
    }

    tilemapLayer.tilesDrawn = outputArray.length;
    tilemapLayer.tilesTotal = mapWidth * mapHeight;

    return outputArray;
};

module.exports = RunCull;
