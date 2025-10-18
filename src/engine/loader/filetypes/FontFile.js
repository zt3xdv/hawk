

var Class = require('../../utils/Class');
var CONST = require('../const');
var File = require('../File');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var GetURL = require('../GetURL');
var IsPlainObject = require('../../utils/object/IsPlainObject');


var FontFile = new Class({

    Extends: File,

    initialize:

    function FontFile (loader, key, url, format, descriptors, xhrSettings)
    {
        var extension = 'ttf';

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            url = GetFastValue(config, 'url');
            format = GetFastValue(config, 'format', 'truetype');
            descriptors = GetFastValue(config, 'descriptors', null);
            xhrSettings = GetFastValue(config, 'xhrSettings');
            extension = GetFastValue(config, 'extension', extension);
        }
        else if (format === undefined)
        {
            format = 'truetype';
        }

        var fileConfig = {
            type: 'font',
            cache: false,
            extension: extension,
            responseType: 'text',
            key: key,
            url: url,
            xhrSettings: xhrSettings
        };

        File.call(this, loader, fileConfig);

        this.data = {
            format: format,
            descriptors: descriptors
        };

        this.state = CONST.FILE_POPULATED;
    },

    
    onProcess: function ()
    {
        this.state = CONST.FILE_PROCESSING;

        this.src = GetURL(this, this.loader.baseURL);

        var font;
        var key = this.key;
        var source = 'url(' + this.src + ') format("' + this.data.format + '")';

        if (this.data.descriptors)
        {
            font = new FontFace(key, source, this.data.descriptors);
        }
        else
        {
            font = new FontFace(key, source);
        }

        var _this = this;

        font.load().then(function ()
        {
            document.fonts.add(font);
            document.body.classList.add("fonts-loaded");
            
            _this.onProcessComplete();

        }).catch(function ()
        {
            console.warn('Font failed to load', source);

            _this.onProcessComplete();
        });
    }

});


FileTypesManager.register('font', function (key, url, format, descriptors, xhrSettings)
{
    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            this.addFile(new FontFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new FontFile(this, key, url, format, descriptors, xhrSettings));
    }

    return this;
});

module.exports = FontFile;
