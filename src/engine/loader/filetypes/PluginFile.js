

var Class = require('../../utils/Class');
var CONST = require('../const');
var File = require('../File');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var IsPlainObject = require('../../utils/object/IsPlainObject');


var PluginFile = new Class({

    Extends: File,

    initialize:

    function PluginFile (loader, key, url, start, mapping, xhrSettings)
    {
        var extension = 'js';

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            url = GetFastValue(config, 'url');
            xhrSettings = GetFastValue(config, 'xhrSettings');
            extension = GetFastValue(config, 'extension', extension);
            start = GetFastValue(config, 'start');
            mapping = GetFastValue(config, 'mapping');
        }

        var fileConfig = {
            type: 'plugin',
            cache: false,
            extension: extension,
            responseType: 'text',
            key: key,
            url: url,
            xhrSettings: xhrSettings,
            config: {
                start: start,
                mapping: mapping
            }
        };

        File.call(this, loader, fileConfig);

        // If the url variable refers to a class, add the plugin directly
        if (typeof url === 'function')
        {
            this.data = url;

            this.state = CONST.FILE_POPULATED;
        }
    },

    
    onProcess: function ()
    {
        var pluginManager = this.loader.systems.plugins;
        var config = this.config;

        var start = GetFastValue(config, 'start', false);
        var mapping = GetFastValue(config, 'mapping', null);

        if (this.state === CONST.FILE_POPULATED)
        {
            pluginManager.install(this.key, this.data, start, mapping);
        }
        else
        {
            //  Plugin added via a js file
            this.state = CONST.FILE_PROCESSING;

            this.data = document.createElement('script');
            this.data.language = 'javascript';
            this.data.type = 'text/javascript';
            this.data.defer = false;
            this.data.text = this.xhrLoader.responseText;

            document.head.appendChild(this.data);

            var plugin = pluginManager.install(this.key, window[this.key], start, mapping);

            if (start || mapping)
            {
                //  Install into the current Scene Systems and Scene
                this.loader.systems[mapping] = plugin;
                this.loader.scene[mapping] = plugin;
            }
        }

        this.onProcessComplete();
    }

});


FileTypesManager.register('plugin', function (key, url, start, mapping, xhrSettings)
{
    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            this.addFile(new PluginFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new PluginFile(this, key, url, start, mapping, xhrSettings));
    }

    return this;
});

module.exports = PluginFile;
