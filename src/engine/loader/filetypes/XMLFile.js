

var Class = require('../../utils/Class');
var CONST = require('../const');
var File = require('../File');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var IsPlainObject = require('../../utils/object/IsPlainObject');
var ParseXML = require('../../dom/ParseXML');


var XMLFile = new Class({

    Extends: File,

    initialize:

    function XMLFile (loader, key, url, xhrSettings)
    {
        var extension = 'xml';

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            url = GetFastValue(config, 'url');
            xhrSettings = GetFastValue(config, 'xhrSettings');
            extension = GetFastValue(config, 'extension', extension);
        }

        var fileConfig = {
            type: 'xml',
            cache: loader.cacheManager.xml,
            extension: extension,
            responseType: 'text',
            key: key,
            url: url,
            xhrSettings: xhrSettings
        };

        File.call(this, loader, fileConfig);
    },

    
    onProcess: function ()
    {
        this.state = CONST.FILE_PROCESSING;

        this.data = ParseXML(this.xhrLoader.responseText);

        if (this.data)
        {
            this.onProcessComplete();
        }
        else
        {
            this.onProcessError();
        }
    }

});


FileTypesManager.register('xml', function (key, url, xhrSettings)
{
    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            this.addFile(new XMLFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new XMLFile(this, key, url, xhrSettings));
    }

    return this;
});

module.exports = XMLFile;
