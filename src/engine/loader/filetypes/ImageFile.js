

var Class = require('../../utils/Class');
var CONST = require('../const');
var File = require('../File');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var IsPlainObject = require('../../utils/object/IsPlainObject');
var GetURL = require('../GetURL');


var ImageFile = new Class({

    Extends: File,

    initialize:

    function ImageFile (loader, key, url, xhrSettings, frameConfig)
    {
        var extension = 'png';
        var normalMapURL;

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            url = GetFastValue(config, 'url');
            normalMapURL = GetFastValue(config, 'normalMap');
            xhrSettings = GetFastValue(config, 'xhrSettings');
            extension = GetFastValue(config, 'extension', extension);
            frameConfig = GetFastValue(config, 'frameConfig');
        }

        if (Array.isArray(url))
        {
            normalMapURL = url[1];
            url = url[0];
        }

        var fileConfig = {
            type: 'image',
            cache: loader.textureManager,
            extension: extension,
            responseType: 'blob',
            key: key,
            url: url,
            xhrSettings: xhrSettings,
            config: frameConfig
        };

        File.call(this, loader, fileConfig);

        //  Do we have a normal map to load as well?
        if (normalMapURL)
        {
            var normalMap = new ImageFile(loader, this.key, normalMapURL, xhrSettings, frameConfig);

            normalMap.type = 'normalMap';

            this.setLink(normalMap);

            loader.addFile(normalMap);
        }

        this.useImageElementLoad = (loader.imageLoadType === 'HTMLImageElement') || this.base64;

        if (this.useImageElementLoad)
        {
            this.load = this.loadImage;
            this.onProcess = this.onProcessImage;
        }
    },

    
    onProcess: function ()
    {
        this.state = CONST.FILE_PROCESSING;

        this.data = new Image();

        this.data.crossOrigin = this.crossOrigin;

        var _this = this;

        this.data.onload = function ()
        {
            File.revokeObjectURL(_this.data);

            _this.onProcessComplete();
        };

        this.data.onerror = function ()
        {
            File.revokeObjectURL(_this.data);

            _this.onProcessError();
        };

        File.createObjectURL(this.data, this.xhrLoader.response, 'image/png');
    },

    
    onProcessImage: function ()
    {
        var result = this.state;

        this.state = CONST.FILE_PROCESSING;

        if (result === CONST.FILE_LOADED)
        {
            this.onProcessComplete();
        }
        else
        {
            this.onProcessError();
        }
    },

    
    loadImage: function ()
    {
        this.state = CONST.FILE_LOADING;

        this.src = GetURL(this, this.loader.baseURL);

        this.data = new Image();

        this.data.crossOrigin = this.crossOrigin;

        var _this = this;

        this.data.onload = function ()
        {
            _this.state = CONST.FILE_LOADED;

            _this.loader.nextFile(_this, true);
        };

        this.data.onerror = function ()
        {
            _this.loader.nextFile(_this, false);
        };

        this.data.src = this.src;
    },

    
    addToCache: function ()
    {
        //  Check if we have a linked normal map
        var linkFile = this.linkFile;

        if (linkFile)
        {
            //  We do, but has it loaded?
            if (linkFile.state >= CONST.FILE_COMPLETE)
            {
                if (linkFile.type === 'spritesheet')
                {
                    linkFile.addToCache();
                }
                else if (this.type === 'normalMap')
                {
                    //  linkFile.data = Image
                    //  this.data = Normal Map
                    this.cache.addImage(this.key, linkFile.data, this.data);
                }
                else
                {
                    //  linkFile.data = Normal Map
                    //  this.data = Image
                    this.cache.addImage(this.key, this.data, linkFile.data);
                }
            }

            //  Nothing to do here, we'll use the linkFile `addToCache` call
            //  to process this pair
        }
        else
        {
            this.cache.addImage(this.key, this.data);
        }
    }

});


FileTypesManager.register('image', function (key, url, xhrSettings)
{
    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            this.addFile(new ImageFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new ImageFile(this, key, url, xhrSettings));
    }

    return this;
});

module.exports = ImageFile;
