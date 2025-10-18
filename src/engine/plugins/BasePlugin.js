var Class = require('../utils/Class');

var BasePlugin = new Class({

    initialize:

    function BasePlugin (pluginManager)
    {

        this.pluginManager = pluginManager;

        this.game = pluginManager.game;
    },

    init: function ()
    {
    },

    start: function ()
    {

    },

    stop: function ()
    {
    },

    destroy: function ()
    {
        this.pluginManager = null;
        this.game = null;
        this.scene = null;
        this.systems = null;
    }

});

module.exports = BasePlugin;
