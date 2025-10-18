var AssignTileProperties = require('./AssignTileProperties');
var BuildTilesetIndex = require('./BuildTilesetIndex');
var CONST = require('../../const/ORIENTATION_CONST');
var DeepCopy = require('../../../utils/object/DeepCopy');
var Formats = require('../../Formats');
var FromOrientationString = require('../FromOrientationString');
var MapData = require('../../mapdata/MapData');
var ParseImageLayers = require('./ParseImageLayers');
var ParseObjectLayers = require('./ParseObjectLayers');
var ParseTileLayers = require('./ParseTileLayers');
var ParseTilesets = require('./ParseTilesets');

var ParseJSONTiled = function (name, source, insertNull)
{
    var json = DeepCopy(source);

    var mapData = new MapData({
        width: json.width,
        height: json.height,
        name: name,
        tileWidth: json.tilewidth,
        tileHeight: json.tileheight,
        orientation: FromOrientationString(json.orientation),
        format: Formats.TILED_JSON,
        version: json.version,
        properties: json.properties,
        renderOrder: json.renderorder,
        infinite: json.infinite
    });

    if (mapData.orientation === CONST.HEXAGONAL)
    {
        mapData.hexSideLength = json.hexsidelength;
        mapData.staggerAxis = json.staggeraxis;
        mapData.staggerIndex = json.staggerindex;

        if (mapData.staggerAxis === 'y')
        {
            var triangleHeight = (mapData.tileHeight - mapData.hexSideLength) / 2;
            mapData.widthInPixels = mapData.tileWidth * (mapData.width + 0.5);
            mapData.heightInPixels = mapData.height * (mapData.hexSideLength + triangleHeight) + triangleHeight;
        }
        else
        {
            var triangleWidth = (mapData.tileWidth - mapData.hexSideLength) / 2;
            mapData.widthInPixels = mapData.width * (mapData.hexSideLength + triangleWidth) + triangleWidth;
            mapData.heightInPixels = mapData.tileHeight * (mapData.height + 0.5);
        }
    }

    mapData.layers = ParseTileLayers(json, insertNull);
    mapData.images = ParseImageLayers(json);

    var sets = ParseTilesets(json);

    mapData.tilesets = sets.tilesets;
    mapData.imageCollections = sets.imageCollections;

    mapData.objects = ParseObjectLayers(json);

    mapData.tiles = BuildTilesetIndex(mapData);

    AssignTileProperties(mapData);

    return mapData;
};

module.exports = ParseJSONTiled;
