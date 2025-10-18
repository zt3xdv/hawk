var Class = require('../utils/Class');
var DataManager = require('./DataManager');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');

var DataManagerPlugin = new Class({

    Extends: DataManager,

    initialize:

    function DataManagerPlugin (scene)
    {
        DataManager.call(this, scene, scene.sys.events);

        this.scene = scene;

        this.systems = scene.sys;

        scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
        scene.sys.events.on(SceneEvents.START, this.start, this);
    },

    boot: function ()
    {
        this.events = this.systems.events;

        this.events.once(SceneEvents.DESTROY, this.destroy, this);
    },

    start: function ()
    {
        this.events.once(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    shutdown: function ()
    {
        this.systems.events.off(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    destroy: function ()
    {
        DataManager.prototype.destroy.call(this);

        this.events.off(SceneEvents.START, this.start, this);

        this.scene = null;
        this.systems = null;
    }

});

PluginCache.register('DataManagerPlugin', DataManagerPlugin, 'data');

module.exports = DataManagerPlugin;
