var Class = require('../utils/Class');
var CustomMap = require('../structs/Map');
var EventEmitter = require('eventemitter3');
var Events = require('./events');

var BaseCache = new Class({

    initialize:

    function BaseCache ()
    {

        this.entries = new CustomMap();

        this.events = new EventEmitter();
    },

    add: function (key, data)
    {
        this.entries.set(key, data);

        this.events.emit(Events.ADD, this, key, data);

        return this;
    },

    has: function (key)
    {
        return this.entries.has(key);
    },

    exists: function (key)
    {
        return this.entries.has(key);
    },

    get: function (key)
    {
        return this.entries.get(key);
    },

    remove: function (key)
    {
        var entry = this.get(key);

        if (entry)
        {
            this.entries.delete(key);

            this.events.emit(Events.REMOVE, this, key, entry.data);
        }

        return this;
    },

    getKeys: function ()
    {
        return this.entries.keys();
    },

    destroy: function ()
    {
        this.entries.clear();
        this.events.removeAllListeners();

        this.entries = null;
        this.events = null;
    }

});

module.exports = BaseCache;
