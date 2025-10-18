var BasePlugin = require('./BasePlugin');
var Class = require('../utils/Class');
var SceneEvents = require('../scene/events');

var ScenePlugin = new Class({

    Extends: BasePlugin,

    initialize:

    function ScenePlugin (scene, pluginManager, pluginKey)
    {
        BasePlugin.call(this, pluginManager);

        this.scene = scene;

        this.systems = scene.sys;

        this.pluginKey = pluginKey;

        scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
    },

    boot: function ()
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

module.exports = ScenePlugin;
