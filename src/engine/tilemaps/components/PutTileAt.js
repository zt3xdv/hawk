var Tile = require('../Tile');
var IsInLayerBounds = require('./IsInLayerBounds');
var CalculateFacesAt = require('./CalculateFacesAt');
var SetTileCollision = require('./SetTileCollision');

var PutTileAt = function (tile, tileX, tileY, recalculateFaces, layer)
{
    if (recalculateFaces === undefined) { recalculateFaces = true; }

    if (!IsInLayerBounds(tileX, tileY, layer))
    {
        return null;
    }

    var index;
    var oldTile = layer.data[tileY][tileX];
    var oldTileCollides = oldTile && oldTile.collides;

    if (tile instanceof Tile)
    {
        if (layer.data[tileY][tileX] === null)
        {
            layer.data[tileY][tileX] = new Tile(layer, tile.index, tileX, tileY, layer.tileWidth, layer.tileHeight);
        }

        layer.data[tileY][tileX].copy(tile);
    }
    else
    {
        index = tile;

        if (layer.data[tileY][tileX] === null)
        {
            layer.data[tileY][tileX] = new Tile(layer, index, tileX, tileY, layer.tileWidth, layer.tileHeight);
        }
        else
        {
            layer.data[tileY][tileX].index = index;
        }
    }

    var newTile = layer.data[tileY][tileX];
    var collides = layer.collideIndexes.indexOf(newTile.index) !== -1;

    index = tile instanceof Tile ? tile.index : tile;

    if (index === -1)
    {
        newTile.width = layer.tileWidth;
        newTile.height = layer.tileHeight;
    }
    else
    {
        var tilemap = layer.tilemapLayer.tilemap;
        var tiles = tilemap.tiles;
        var sid = tiles[index][2];
        var set = tilemap.tilesets[sid];

        newTile.width = set.tileWidth;
        newTile.height = set.tileHeight;
    }

    SetTileCollision(newTile, collides);

    if (recalculateFaces && (oldTileCollides !== newTile.collides))
    {
        CalculateFacesAt(tileX, tileY, layer);
    }

    return newTile;
};

module.exports = PutTileAt;
