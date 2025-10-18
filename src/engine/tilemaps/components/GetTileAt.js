var IsInLayerBounds = require('./IsInLayerBounds');

var GetTileAt = function (tileX, tileY, nonNull, layer)
{
    if (IsInLayerBounds(tileX, tileY, layer))
    {
        var tile = layer.data[tileY][tileX] || null;

        if (!tile)
        {
            return null;
        }
        else if (tile.index === -1)
        {
            return nonNull ? tile : null;
        }
        else
        {
            return tile;
        }
    }
    else
    {
        return null;
    }
};

module.exports = GetTileAt;
