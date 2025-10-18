

var Class = require('../../utils/Class');
var CONST = require('../const');
var FileTypesManager = require('../FileTypesManager');
var JSONFile = require('./JSONFile');


var PackFile = new Class({

    Extends: JSONFile,

    initialize:

    //  url can either be a string, in which case it is treated like a proper url, or an object, in which case it is treated as a ready-made JS Object
    //  dataKey allows you to pluck a specific object out of the JSON and put just that into the cache, rather than the whole thing

    function PackFile (loader, key, url, xhrSettings, dataKey)
    {
        JSONFile.call(this, loader, key, url, xhrSettings, dataKey);

        this.type = 'packfile';
    },

    
    onProcess: function ()
    {
        if (this.state !== CONST.FILE_POPULATED)
        {
            this.state = CONST.FILE_PROCESSING;

            this.data = JSON.parse(this.xhrLoader.responseText);
        }

        if (this.data.hasOwnProperty('files') && this.config)
        {
            var newData = {};

            newData[this.config] = this.data;

            this.data = newData;
        }

        //  Let's pass the pack file data over to the Loader ...
        this.loader.addPack(this.data, this.config);

        this.onProcessComplete();
    }

});


FileTypesManager.register('pack', function (key, url, dataKey, xhrSettings)
{
    //  Supports an Object file definition in the key argument
    //  Or an array of objects in the key argument
    //  Or a single entry where all arguments have been defined

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            this.addFile(new PackFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new PackFile(this, key, url, xhrSettings, dataKey));
    }

    return this;
});

module.exports = PackFile;
