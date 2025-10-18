var DeepCopy = require('../../utils/object/DeepCopy');
var GetTilesWithin = require('./GetTilesWithin');
var ReplaceByIndex = require('./ReplaceByIndex');

var CreateFromTiles = function (indexes, replacements, spriteConfig, scene, camera, layer)
{
    if (!spriteConfig) { spriteConfig = {}; }

    if (!Array.isArray(indexes))
    {
        indexes = [ indexes ];
    }

    var tilemapLayer = layer.tilemapLayer;

    if (!scene) { scene = tilemapLayer.scene; }
    if (!camera) { camera = scene.cameras.main; }

    var layerWidth = layer.width;
    var layerHeight = layer.height;

    var tiles = GetTilesWithin(0, 0, layerWidth, layerHeight, null, layer);
    var sprites = [];
    var i;

    var mergeExtras = function (config, tile, properties)
    {
        for (var i = 0; i < properties.length; i++)
        {
            var property = properties[i];

            if (!config.hasOwnProperty(property))
            {
                config[property] = tile[property];
            }
        }
    };

    for (i = 0; i < tiles.length; i++)
    {
        var tile = tiles[i];
        var config = DeepCopy(spriteConfig);

        if (indexes.indexOf(tile.index) !== -1)
        {
            var point = tilemapLayer.tileToWorldXY(tile.x, tile.y, undefined, camera,layer);

            config.x = point.x;
            config.y = point.y;

            mergeExtras(config, tile, [ 'rotation', 'flipX', 'flipY', 'alpha', 'visible', 'tint' ]);

            if (!config.hasOwnProperty('origin'))
            {
                config.x += tile.width * 0.5;
                config.y += tile.height * 0.5;
            }

            if (config.hasOwnProperty('useSpriteSheet'))
            {
                config.key = tile.tileset.image;
                config.frame = tile.index - tile.tileset.firstgid;
            }

            sprites.push(scene.make.sprite(config));
        }
    }

    if (Array.isArray(replacements))
    {

        for (i = 0; i < indexes.length; i++)
        {
            ReplaceByIndex(indexes[i], replacements[i], 0, 0, layerWidth, layerHeight, layer);
        }
    }
    else if (replacements !== null)
    {

        for (i = 0; i < indexes.length; i++)
        {
            ReplaceByIndex(indexes[i], replacements, 0, 0, layerWidth, layerHeight, layer);
        }
    }

    return sprites;
};

module.exports = CreateFromTiles;
