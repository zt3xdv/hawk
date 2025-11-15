var Class = require('../utils/Class');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');
var GameObjectCreator = new Class({
  initialize: function GameObjectCreator(scene) {
    this.scene = scene;
    this.systems = scene.sys;
    this.events = scene.sys.events;
    this.displayList;
    this.updateList;
    this.events.once(SceneEvents.BOOT, this.boot, this);
    this.events.on(SceneEvents.START, this.start, this);
  },
  boot: function () {
    this.displayList = this.systems.displayList;
    this.updateList = this.systems.updateList;
    this.events.once(SceneEvents.DESTROY, this.destroy, this);
  },
  start: function () {
    this.events.once(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  shutdown: function () {
    this.events.off(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  destroy: function () {
    this.shutdown();
    this.events.off(SceneEvents.START, this.start, this);
    this.scene = null;
    this.systems = null;
    this.events = null;
    this.displayList = null;
    this.updateList = null;
  },
});
GameObjectCreator.register = function (factoryType, factoryFunction) {
  if (!GameObjectCreator.prototype.hasOwnProperty(factoryType)) {
    GameObjectCreator.prototype[factoryType] = factoryFunction;
  }
};
GameObjectCreator.remove = function (factoryType) {
  if (GameObjectCreator.prototype.hasOwnProperty(factoryType)) {
    delete GameObjectCreator.prototype[factoryType];
  }
};
PluginCache.register('GameObjectCreator', GameObjectCreator, 'make');
module.exports = GameObjectCreator;
