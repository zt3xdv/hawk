

var Class = require('../../utils/Class');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var ImageFile = require('./ImageFile');
var IsPlainObject = require('../../utils/object/IsPlainObject');
var MultiFile = require('../MultiFile');
var ParseXMLBitmapFont = require('../../gameobjects/bitmaptext/ParseXMLBitmapFont');
var XMLFile = require('./XMLFile');


var BitmapFontFile = new Class({

    Extends: MultiFile,

    initialize:

    function BitmapFontFile (loader, key, textureURL, fontDataURL, textureXhrSettings, fontDataXhrSettings)
    {
        var image;
        var data;

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');

            image = new ImageFile(loader, {
                key: key,
                url: GetFastValue(config, 'textureURL'),
                extension: GetFastValue(config, 'textureExtension', 'png'),
                normalMap: GetFastValue(config, 'normalMap'),
                xhrSettings: GetFastValue(config, 'textureXhrSettings')
            });

            data = new XMLFile(loader, {
                key: key,
                url: GetFastValue(config, 'fontDataURL'),
                extension: GetFastValue(config, 'fontDataExtension', 'xml'),
                xhrSettings: GetFastValue(config, 'fontDataXhrSettings')
            });
        }
        else
        {
            image = new ImageFile(loader, key, textureURL, textureXhrSettings);
            data = new XMLFile(loader, key, fontDataURL, fontDataXhrSettings);
        }

        if (image.linkFile)
        {
            //  Image has a normal map
            MultiFile.call(this, loader, 'bitmapfont', key, [ image, data, image.linkFile ]);
        }
        else
        {
            MultiFile.call(this, loader, 'bitmapfont', key, [ image, data ]);
        }
    },

    
    addToCache: function ()
    {
        if (this.isReadyToProcess())
        {
            var image = this.files[0];
            var xml = this.files[1];

            image.addToCache();

            var texture = image.cache.get(image.key);

            var data = ParseXMLBitmapFont(xml.data, image.cache.getFrame(image.key), 0, 0, texture);

            this.loader.cacheManager.bitmapFont.add(image.key, { data: data, texture: image.key, frame: null });

            this.complete = true;
        }
    }

});


FileTypesManager.register('bitmapFont', function (key, textureURL, fontDataURL, textureXhrSettings, fontDataXhrSettings)
{
    var multifile;

    //  Supports an Object file definition in the key argument
    //  Or an array of objects in the key argument
    //  Or a single entry where all arguments have been defined

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            multifile = new BitmapFontFile(this, key[i]);

            this.addFile(multifile.files);
        }
    }
    else
    {
        multifile = new BitmapFontFile(this, key, textureURL, fontDataURL, textureXhrSettings, fontDataXhrSettings);

        this.addFile(multifile.files);
    }

    return this;
});

module.exports = BitmapFontFile;
