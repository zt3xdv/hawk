var Formats = require('../../Formats');
var MapData = require('../../mapdata/MapData');
var ParseTileLayers = require('./ParseTileLayers');
var ParseTilesets = require('./ParseTilesets');

var ParseWeltmeister = function (name, json, insertNull)
{
    if (json.layer.length === 0)
    {
        console.warn('No layers found in the Weltmeister map: ' + name);
        return null;
    }

    var width = 0;
    var height = 0;

    for (var i = 0; i < json.layer.length; i++)
    {
        if (json.layer[i].width > width) { width = json.layer[i].width; }
        if (json.layer[i].height > height) { height = json.layer[i].height; }
    }

    var mapData = new MapData({
        width: width,
        height: height,
        name: name,
        tileWidth: json.layer[0].tilesize,
        tileHeight: json.layer[0].tilesize,
        format: Formats.WELTMEISTER
    });

    mapData.layers = ParseTileLayers(json, insertNull);
    mapData.tilesets = ParseTilesets(json);

    return mapData;
};

module.exports = ParseWeltmeister;
