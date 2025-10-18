var Tileset = require('../../Tileset');

var ParseTilesets = function (json)
{
    var tilesets = [];
    var tilesetsNames = [];

    for (var i = 0; i < json.layer.length; i++)
    {
        var layer = json.layer[i];

        var tilesetName = layer.tilesetName;

        if (tilesetName !== '' && tilesetsNames.indexOf(tilesetName) === -1)
        {
            tilesetsNames.push(tilesetName);

            tilesets.push(new Tileset(tilesetName, 0, layer.tilesize, layer.tilesize, 0, 0));
        }
    }

    return tilesets;
};

module.exports = ParseTilesets;
