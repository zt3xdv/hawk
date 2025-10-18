

var Class = require('../../utils/Class');
var CONST = require('../const');
var File = require('../File');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var IsPlainObject = require('../../utils/object/IsPlainObject');


var BinaryFile = new Class({

    Extends: File,

    initialize:

    function BinaryFile (loader, key, url, xhrSettings, dataType)
    {
        var extension = 'bin';

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            url = GetFastValue(config, 'url');
            xhrSettings = GetFastValue(config, 'xhrSettings');
            extension = GetFastValue(config, 'extension', extension);
            dataType = GetFastValue(config, 'dataType', dataType);
        }

        var fileConfig = {
            type: 'binary',
            cache: loader.cacheManager.binary,
            extension: extension,
            responseType: 'arraybuffer',
            key: key,
            url: url,
            xhrSettings: xhrSettings,
            config: { dataType: dataType }
        };

        File.call(this, loader, fileConfig);
    },

    
    onProcess: function ()
    {
        this.state = CONST.FILE_PROCESSING;

        var ctor = this.config.dataType;

        this.data = (ctor) ? new ctor(this.xhrLoader.response) : this.xhrLoader.response;

        this.onProcessComplete();
    }

});


FileTypesManager.register('binary', function (key, url, dataType, xhrSettings)
{
    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            this.addFile(new BinaryFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new BinaryFile(this, key, url, xhrSettings, dataType));
    }

    return this;
});

module.exports = BinaryFile;
