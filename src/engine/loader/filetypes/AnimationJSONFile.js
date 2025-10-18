

var Class = require('../../utils/Class');
var FileTypesManager = require('../FileTypesManager');
var JSONFile = require('./JSONFile');
var LoaderEvents = require('../events');


var AnimationJSONFile = new Class({

    Extends: JSONFile,

    initialize:

    //  url can either be a string, in which case it is treated like a proper url, or an object, in which case it is treated as a ready-made JS Object
    //  dataKey allows you to pluck a specific object out of the JSON and put just that into the cache, rather than the whole thing

    function AnimationJSONFile (loader, key, url, xhrSettings, dataKey)
    {
        JSONFile.call(this, loader, key, url, xhrSettings, dataKey);

        this.type = 'animationJSON';
    },

    
    onProcess: function ()
    {
        //  We need to hook into this event:
        this.loader.once(LoaderEvents.POST_PROCESS, this.onLoadComplete, this);

        //  But the rest is the same as a normal JSON file
        JSONFile.prototype.onProcess.call(this);
    },

    
    onLoadComplete: function ()
    {
        this.loader.systems.anims.fromJSON(this.data);
    }

});


FileTypesManager.register('animation', function (key, url, dataKey, xhrSettings)
{
    //  Supports an Object file definition in the key argument
    //  Or an array of objects in the key argument
    //  Or a single entry where all arguments have been defined

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            this.addFile(new AnimationJSONFile(this, key[i]));
        }
    }
    else
    {
        this.addFile(new AnimationJSONFile(this, key, url, xhrSettings, dataKey));
    }

    return this;
});

module.exports = AnimationJSONFile;
