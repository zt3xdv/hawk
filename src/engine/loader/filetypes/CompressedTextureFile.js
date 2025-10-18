

var AtlasJSONFile = require('./AtlasJSONFile');
var BinaryFile = require('./BinaryFile');
var Class = require('../../utils/Class');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var ImageFile = require('./ImageFile');
var IsPlainObject = require('../../utils/object/IsPlainObject');
var JSONFile = require('./JSONFile');
var KTXParser = require('../../textures/parsers/KTXParser');
var Merge = require('../../utils/object/Merge');
var MultiAtlasFile = require('./MultiAtlasFile');
var MultiFile = require('../MultiFile');
var PVRParser = require('../../textures/parsers/PVRParser');
var verifyCompressedTexture = require('../../textures/parsers/VerifyCompressedTexture');


var CompressedTextureFile = new Class({

    Extends: MultiFile,

    initialize:

    function CompressedTextureFile (loader, key, entry, xhrSettings)
    {
        if (entry.multiAtlasURL)
        {
            var multi = new JSONFile(loader, {
                key: key,
                url: entry.multiAtlasURL,
                xhrSettings: xhrSettings,
                config: entry
            });

            MultiFile.call(this, loader, 'texture', key, [ multi ]);
        }
        else
        {
            var extension = entry.textureURL.substr(entry.textureURL.length - 3);

            if (!entry.type)
            {
                entry.type = (extension.toLowerCase() === 'ktx') ? 'KTX' : 'PVR';
            }

            var image = new BinaryFile(loader, {
                key: key,
                url: entry.textureURL,
                extension: extension,
                xhrSettings: xhrSettings,
                config: entry
            });

            if (entry.atlasURL)
            {
                var data = new JSONFile(loader, {
                    key: key,
                    url: entry.atlasURL,
                    xhrSettings: xhrSettings,
                    config: entry
                });

                MultiFile.call(this, loader, 'texture', key, [ image, data ]);
            }
            else
            {
                MultiFile.call(this, loader, 'texture', key, [ image ]);
            }
        }

        this.config = entry;
    },

    
    onFileComplete: function (file)
    {
        var index = this.files.indexOf(file);

        if (index !== -1)
        {
            this.pending--;

            if (!this.config.multiAtlasURL)
            {
                return;
            }

            if (file.type === 'json' && file.data.hasOwnProperty('textures'))
            {
                //  Inspect the data for the files to now load
                var textures = file.data.textures;

                var config = this.config;
                var loader = this.loader;

                var currentBaseURL = loader.baseURL;
                var currentPath = loader.path;
                var currentPrefix = loader.prefix;

                var baseURL = GetFastValue(config, 'multiBaseURL', this.baseURL);
                var path = GetFastValue(config, 'multiPath', this.path);
                var prefix = GetFastValue(config, 'prefix', this.prefix);
                var textureXhrSettings = GetFastValue(config, 'textureXhrSettings');

                if (baseURL)
                {
                    loader.setBaseURL(baseURL);
                }

                if (path)
                {
                    loader.setPath(path);
                }

                if (prefix)
                {
                    loader.setPrefix(prefix);
                }

                for (var i = 0; i < textures.length; i++)
                {
                    //  "image": "texture-packer-multi-atlas-0.png",
                    var textureURL = textures[i].image;

                    var key = 'CMA' + this.multiKeyIndex + '_' + textureURL;

                    var image = new BinaryFile(loader, key, textureURL, textureXhrSettings);

                    this.addToMultiFile(image);

                    loader.addFile(image);

                    //  "normalMap": "texture-packer-multi-atlas-0_n.png",
                    if (textures[i].normalMap)
                    {
                        var normalMap = new BinaryFile(loader, key, textures[i].normalMap, textureXhrSettings);

                        normalMap.type = 'normalMap';

                        image.setLink(normalMap);

                        this.addToMultiFile(normalMap);

                        loader.addFile(normalMap);
                    }
                }

                //  Reset the loader settings
                loader.setBaseURL(currentBaseURL);
                loader.setPath(currentPath);
                loader.setPrefix(currentPrefix);
            }
        }
    },

    
    addToCache: function ()
    {
        function compressionWarning (message)
        {
            console.warn('Compressed Texture Invalid: "' + image.key + '". ' + message);
        }

        if (this.isReadyToProcess())
        {
            var entry = this.config;

            if (entry.multiAtlasURL)
            {
                this.addMultiToCache();
            }
            else
            {
                var renderer = this.loader.systems.renderer;
                var textureManager = this.loader.textureManager;
                var textureData;

                var image = this.files[0];
                var json = this.files[1];

                if (entry.type === 'PVR')
                {
                    textureData = PVRParser(image.data);
                }
                else if (entry.type === 'KTX')
                {
                    textureData = KTXParser(image.data);
                    if (!textureData)
                    {
                        compressionWarning('KTX file contains unsupported format.');
                    }
                }

                // Check block size.
                if (textureData && !verifyCompressedTexture(textureData))
                {
                    compressionWarning('Texture dimensions failed verification. Check the texture format specifications for ' + entry.format + ' 0x' + textureData.internalFormat.toString(16) + '.');
                    textureData = null;
                }

                // Check texture compression.
                if (textureData && !renderer.supportsCompressedTexture(entry.format, textureData.internalFormat))
                {
                    compressionWarning('Texture format ' + entry.format + ' with internal format ' + textureData.internalFormat + ' not supported by the GPU. Texture invalid. This is often due to the texture using sRGB instead of linear RGB.');
                    textureData = null;
                }

                if (textureData)
                {
                    textureData.format = renderer.getCompressedTextureName(entry.format, textureData.internalFormat);

                    var atlasData = (json && json.data) ? json.data : null;

                    textureManager.addCompressedTexture(image.key, textureData, atlasData);
                }
            }

            this.complete = true;
        }
    },

    
    addMultiToCache: function ()
    {
        var entry = this.config;
        var json = this.files[0];

        var data = [];
        var images = [];
        var normalMaps = [];

        var renderer = this.loader.systems.renderer;
        var textureManager = this.loader.textureManager;
        var textureData;

        for (var i = 1; i < this.files.length; i++)
        {
            var file = this.files[i];

            if (file.type === 'normalMap')
            {
                continue;
            }

            var pos = file.key.indexOf('_');
            var key = file.key.substr(pos + 1);

            var image = file.data;

            //  Now we need to find out which json entry this mapped to
            for (var t = 0; t < json.data.textures.length; t++)
            {
                var item = json.data.textures[t];

                if (item.image === key)
                {
                    if (entry.type === 'PVR')
                    {
                        textureData = PVRParser(image);
                    }
                    else if (entry.type === 'KTX')
                    {
                        textureData = KTXParser(image);
                    }

                    if (textureData && renderer.supportsCompressedTexture(entry.format, textureData.internalFormat))
                    {
                        textureData.format = renderer.getCompressedTextureName(entry.format, textureData.internalFormat);

                        images.push(textureData);

                        data.push(item);

                        if (file.linkFile)
                        {
                            normalMaps.push(file.linkFile.data);
                        }
                    }

                    break;
                }
            }
        }

        if (normalMaps.length === 0)
        {
            normalMaps = undefined;
        }

        textureManager.addAtlasJSONArray(this.key, images, data, normalMaps);

        this.complete = true;
    }

});


FileTypesManager.register('texture', function (key, url, xhrSettings)
{
    var renderer = this.systems.renderer;

    var AddEntry = function (loader, key, urls, xhrSettings)
    {
        var entry = {
            format: null,
            type: null,
            textureURL: undefined,
            atlasURL: undefined,
            multiAtlasURL: undefined,
            multiPath: undefined,
            multiBaseURL: undefined
        };

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            urls = GetFastValue(config, 'url'),
            xhrSettings = GetFastValue(config, 'xhrSettings');
        }

        var matched = false;

        for (var textureBaseFormat in urls)
        {
            if (renderer.supportsCompressedTexture(textureBaseFormat))
            {
                var urlEntry = urls[textureBaseFormat];

                if (typeof urlEntry === 'string')
                {
                    entry.textureURL = urlEntry;
                }
                else
                {
                    entry = Merge(urlEntry, entry);
                }

                entry.format = textureBaseFormat.toUpperCase();

                matched = true;

                break;
            }
        }

        if (!matched)
        {
            console.warn('No supported compressed texture format or IMG fallback', key);
        }
        else if (entry.format === 'IMG')
        {
            var file;
            var multifile;

            if (entry.multiAtlasURL)
            {
                multifile = new MultiAtlasFile(loader, key, entry.multiAtlasURL, entry.multiPath, entry.multiBaseURL, xhrSettings);

                file = multifile.files;
            }
            else if (entry.atlasURL)
            {
                multifile = new AtlasJSONFile(loader, key, entry.textureURL, entry.atlasURL, xhrSettings);

                file = multifile.files;
            }
            else
            {
                file = new ImageFile(loader, key, entry.textureURL, xhrSettings);
            }

            loader.addFile(file);
        }
        else
        {
            var texture = new CompressedTextureFile(loader, key, entry, xhrSettings);

            loader.addFile(texture.files);
        }
    };

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            AddEntry(this, key[i]);
        }
    }
    else
    {
        AddEntry(this, key, url, xhrSettings);
    }

    return this;
});

module.exports = CompressedTextureFile;
