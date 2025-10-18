var Class = require('../utils/Class');
var EE = require('eventemitter3');
var PluginCache = require('../plugins/PluginCache');

var EventEmitter = new Class({

    Extends: EE,

    initialize:

    function EventEmitter ()
    {
        EE.call(this);
    },

    shutdown: function ()
    {
        this.removeAllListeners();
    },

    destroy: function ()
    {
        this.removeAllListeners();
    }

});

PluginCache.register('EventEmitter', EventEmitter, 'events');

module.exports = EventEmitter;
