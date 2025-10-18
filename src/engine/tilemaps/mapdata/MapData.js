var Class = require('../../utils/Class');
var CONST = require('../const/ORIENTATION_CONST');
var GetFastValue = require('../../utils/object/GetFastValue');

var MapData = new Class({

    initialize:

    function MapData (config)
    {
        if (config === undefined) { config = {}; }

        this.name = GetFastValue(config, 'name', 'map');

        this.width = GetFastValue(config, 'width', 0);

        this.height = GetFastValue(config, 'height', 0);

        this.infinite = GetFastValue(config, 'infinite', false);

        this.tileWidth = GetFastValue(config, 'tileWidth', 0);

        this.tileHeight = GetFastValue(config, 'tileHeight', 0);

        this.widthInPixels = GetFastValue(config, 'widthInPixels', this.width * this.tileWidth);

        this.heightInPixels = GetFastValue(config, 'heightInPixels', this.height * this.tileHeight);

        this.format = GetFastValue(config, 'format', null);

        this.orientation = GetFastValue(config, 'orientation', CONST.ORTHOGONAL);

        this.renderOrder = GetFastValue(config, 'renderOrder', 'right-down');

        this.version = GetFastValue(config, 'version', '1');

        this.properties = GetFastValue(config, 'properties', {});

        this.layers = GetFastValue(config, 'layers', []);

        this.images = GetFastValue(config, 'images', []);

        this.objects = GetFastValue(config, 'objects', []);

        if (!Array.isArray(this.objects))
        {
            this.objects = [];
        }

        this.collision = GetFastValue(config, 'collision', {});

        this.tilesets = GetFastValue(config, 'tilesets', []);

        this.imageCollections = GetFastValue(config, 'imageCollections', []);

        this.tiles = GetFastValue(config, 'tiles', []);

        this.hexSideLength = GetFastValue(config, 'hexSideLength', 0);

        this.staggerAxis = GetFastValue(config, 'staggerAxis', 'y');

        this.staggerIndex = GetFastValue(config, 'staggerIndex', 'odd');
    }

});

module.exports = MapData;
