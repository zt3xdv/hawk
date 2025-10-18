

var Class = require('../../utils/Class');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var IsPlainObject = require('../../utils/object/IsPlainObject');
var MultiFile = require('../MultiFile');
var ScriptFile = require('./ScriptFile');


var MultiScriptFile = new Class({

    Extends: MultiFile,

    initialize:

    function MultiScriptFile (loader, key, url, xhrSettings)
    {
        var extension = 'js';
        var files = [];

        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            url = GetFastValue(config, 'url');
            xhrSettings = GetFastValue(config, 'xhrSettings');
            extension = GetFastValue(config, 'extension', extension);
        }

        if (!Array.isArray(url))
        {
            url = [ url ];
        }

        for (var i = 0; i < url.length; i++)
        {
            var scriptFile = new ScriptFile(loader, {
                key: key + '_' + i.toString(),
                url: url[i],
                extension: extension,
                xhrSettings: xhrSettings
            });

            //  Override the default onProcess function
            scriptFile.onProcess = function ()
            {
                this.onProcessComplete();
            };

            files.push(scriptFile);
        }

        MultiFile.call(this, loader, 'scripts', key, files);
    },

    
    addToCache: function ()
    {
        if (this.isReadyToProcess())
        {
            for (var i = 0; i < this.files.length; i++)
            {
                var file = this.files[i];

                file.data = document.createElement('script');
                file.data.language = 'javascript';
                file.data.type = 'text/javascript';
                file.data.defer = false;
                file.data.text = file.xhrLoader.responseText;

                document.head.appendChild(file.data);
            }

            this.complete = true;
        }
    }

});


FileTypesManager.register('scripts', function (key, url, xhrSettings)
{
    var multifile;

    //  Supports an Object file definition in the key argument
    //  Or an array of objects in the key argument
    //  Or a single entry where all arguments have been defined

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            multifile = new MultiScriptFile(this, key[i]);

            this.addFile(multifile.files);
        }
    }
    else
    {
        multifile = new MultiScriptFile(this, key, url, xhrSettings);

        this.addFile(multifile.files);
    }

    return this;
});

module.exports = MultiScriptFile;
