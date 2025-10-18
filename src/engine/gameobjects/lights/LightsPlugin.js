var Class = require('../../utils/Class');
var LightsManager = require('./LightsManager');
var PluginCache = require('../../plugins/PluginCache');
var SceneEvents = require('../../scene/events');

var LightsPlugin = new Class({

    Extends: LightsManager,

    initialize:

    function LightsPlugin (scene)
    {

        this.scene = scene;

        this.systems = scene.sys;

        if (!scene.sys.settings.isBooted)
        {
            scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
        }

        LightsManager.call(this);
    },

    boot: function ()
    {
        var eventEmitter = this.systems.events;

        eventEmitter.on(SceneEvents.SHUTDOWN, this.shutdown, this);
        eventEmitter.on(SceneEvents.DESTROY, this.destroy, this);
    },

    destroy: function ()
    {
        this.shutdown();

        this.scene = undefined;
        this.systems = undefined;
    }

});

PluginCache.register('LightsPlugin', LightsPlugin, 'lights');

module.exports = LightsPlugin;
