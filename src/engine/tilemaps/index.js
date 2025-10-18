var Extend = require('../utils/object/Extend');
var CONST = require('./const');

var Tilemaps = {

    Components: require('./components'),
    Parsers: require('./parsers'),

    Formats: require('./Formats'),
    ImageCollection: require('./ImageCollection'),
    ParseToTilemap: require('./ParseToTilemap'),
    Tile: require('./Tile'),
    Tilemap: require('./Tilemap'),
    TilemapCreator: require('./TilemapCreator'),
    TilemapFactory: require('./TilemapFactory'),
    Tileset: require('./Tileset'),
    TilemapLayer: require('./TilemapLayer'),
    Orientation: require('./const/ORIENTATION_CONST'),

    LayerData: require('./mapdata/LayerData'),
    MapData: require('./mapdata/MapData'),
    ObjectLayer: require('./mapdata/ObjectLayer')

};

Tilemaps = Extend(false, Tilemaps, CONST.ORIENTATION);

module.exports = Tilemaps;
