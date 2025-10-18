var Formats = require('../Formats');
var Parse2DArray = require('./Parse2DArray');
var ParseCSV = require('./ParseCSV');
var ParseJSONTiled = require('./tiled/ParseJSONTiled');
var ParseWeltmeister = require('./impact/ParseWeltmeister');

var Parse = function (name, mapFormat, data, tileWidth, tileHeight, insertNull)
{
    var newMap;

    switch (mapFormat)
    {
        case (Formats.ARRAY_2D):
            newMap = Parse2DArray(name, data, tileWidth, tileHeight, insertNull);
            break;
        case (Formats.CSV):
            newMap = ParseCSV(name, data, tileWidth, tileHeight, insertNull);
            break;
        case (Formats.TILED_JSON):
            newMap = ParseJSONTiled(name, data, insertNull);
            break;
        case (Formats.WELTMEISTER):
            newMap = ParseWeltmeister(name, data, insertNull);
            break;
        default:
            console.warn('Unrecognized tilemap data format: ' + mapFormat);
            newMap = null;
    }

    return newMap;
};

module.exports = Parse;
