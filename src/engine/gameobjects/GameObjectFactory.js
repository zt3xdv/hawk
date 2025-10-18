var Class = require('../utils/Class');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');

var GameObjectFactory = new Class({

    initialize:

    function GameObjectFactory (scene)
    {

        this.scene = scene;

        this.systems = scene.sys;

        this.events = scene.sys.events;

        this.displayList;

        this.updateList;

        this.events.once(SceneEvents.BOOT, this.boot, this);
        this.events.on(SceneEvents.START, this.start, this);
    },

    boot: function ()
    {
        this.displayList = this.systems.displayList;
        this.updateList = this.systems.updateList;

        this.events.once(SceneEvents.DESTROY, this.destroy, this);
    },

    start: function ()
    {
        this.events.once(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    existing: function (child)
    {
        if (child.renderCanvas || child.renderWebGL)
        {
            this.displayList.add(child);
        }

        if (child.preUpdate)
        {
            this.updateList.add(child);
        }

        return child;
    },

    shutdown: function ()
    {
        this.events.off(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    destroy: function ()
    {
        this.shutdown();

        this.events.off(SceneEvents.START, this.start, this);

        this.scene = null;
        this.systems = null;
        this.events = null;

        this.displayList = null;
        this.updateList = null;
    }

});

GameObjectFactory.register = function (factoryType, factoryFunction)
{
    if (!GameObjectFactory.prototype.hasOwnProperty(factoryType))
    {
        GameObjectFactory.prototype[factoryType] = factoryFunction;
    }
};

GameObjectFactory.remove = function (factoryType)
{
    if (GameObjectFactory.prototype.hasOwnProperty(factoryType))
    {
        delete GameObjectFactory.prototype[factoryType];
    }
};

PluginCache.register('GameObjectFactory', GameObjectFactory, 'add');

module.exports = GameObjectFactory;
