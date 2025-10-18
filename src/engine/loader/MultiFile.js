

var Class = require('../utils/Class');
var CONST = require('./const');
var Events = require('./events');


var MultiFile = new Class({

    initialize:

    function MultiFile (loader, type, key, files)
    {
        var finalFiles = [];

        //  Clean out any potential 'null' or 'undefined' file entries
        files.forEach(function (file)
        {
            if (file)
            {
                finalFiles.push(file);
            }
        });

        
        this.loader = loader;

        
        this.type = type;

        
        this.key = key;

        var loadKey = this.key;

        if (loader.prefix && loader.prefix !== '')
        {
            this.key = loader.prefix + loadKey;
        }

        
        this.multiKeyIndex = loader.multiKeyIndex++;

        
        this.files = finalFiles;

        
        this.state = CONST.FILE_PENDING;

        
        this.complete = false;

        

        this.pending = finalFiles.length;

        
        this.failed = 0;

        
        this.config = {};

        
        this.baseURL = loader.baseURL;

        
        this.path = loader.path;

        
        this.prefix = loader.prefix;

        //  Link the files
        for (var i = 0; i < finalFiles.length; i++)
        {
            finalFiles[i].multiFile = this;
        }
    },

    
    isReadyToProcess: function ()
    {
        return (this.pending === 0 && this.failed === 0 && !this.complete);
    },

    
    addToMultiFile: function (file)
    {
        this.files.push(file);

        file.multiFile = this;

        this.pending++;

        this.complete = false;

        return this;
    },

    
    onFileComplete: function (file)
    {
        var index = this.files.indexOf(file);

        if (index !== -1)
        {
            this.pending--;
        }
    },

    
    onFileFailed: function (file)
    {
        var index = this.files.indexOf(file);

        if (index !== -1)
        {
            this.failed++;

            // eslint-disable-next-line no-console
            console.error('File failed: %s "%s" (via %s "%s")', this.type, this.key, file.type, file.key);
        }
    },

    
    pendingDestroy: function ()
    {
        if (this.state === CONST.FILE_PENDING_DESTROY)
        {
            return;
        }

        var key = this.key;
        var type = this.type;

        this.loader.emit(Events.FILE_COMPLETE, key, type);
        this.loader.emit(Events.FILE_KEY_COMPLETE + type + '-' + key, key, type);

        this.loader.flagForRemoval(this);

        for (var i = 0; i < this.files.length; i++)
        {
            this.files[i].pendingDestroy();
        }

        this.state = CONST.FILE_PENDING_DESTROY;
    },

    
    destroy: function ()
    {
        this.loader = null;
        this.files = null;
        this.config = null;
    }

});

module.exports = MultiFile;
