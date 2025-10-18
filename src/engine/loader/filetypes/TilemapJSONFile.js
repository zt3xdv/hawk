

var Class = require('../../utils/Class');
var FileTypesManager = require('../FileTypesManager');
var JSONFile = require('./JSONFile');
var TILEMAP_FORMATS = require('../../tilemaps/Formats');


var TilemapJSONFile = new Class({

    Extends: JSONFile,

    initialize:

    function TilemapJSONFile (loader, key, url, xhrSettings)
    {
        JSONFile.call(this, loader, key, url, xhrSettings);

        this.type = 'tilemapJSON';

        this.cache = loader.cacheManager.tilemap;
    },

    
    addToCache: function ()
    {
        var tiledata = { format: TILEMAP_FORMATS.TILED_JSON, data: this.data };

        this.cache.add(this.key, tiledata);
    }

});


FileTypesManager.register('tilemapTiledJSON', function (key, url, xhrSettings)
{
    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            this.addFile(new TilemapJSONFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new TilemapJSONFile(this, key, url, xhrSettings));
    }

    return this;
});

module.exports = TilemapJSONFile;
