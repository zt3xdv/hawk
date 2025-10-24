var Class = require('../utils/Class');
var ProcessQueue = require('../structs/ProcessQueue');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');
var UpdateList = new Class({
  Extends: ProcessQueue,
  initialize: function UpdateList(scene) {
    ProcessQueue.call(this);
    this.checkQueue = true;
    this.scene = scene;
    this.systems = scene.sys;
    scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
    scene.sys.events.on(SceneEvents.START, this.start, this);
  },
  boot: function () {
    this.systems.events.once(SceneEvents.DESTROY, this.destroy, this);
  },
  start: function () {
    var eventEmitter = this.systems.events;
    eventEmitter.on(SceneEvents.PRE_UPDATE, this.update, this);
    eventEmitter.on(SceneEvents.UPDATE, this.sceneUpdate, this);
    eventEmitter.once(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  sceneUpdate: function (time, delta) {
    var list = this._active;
    var length = list.length;
    for (var i = 0; i < length; i++) {
      var gameObject = list[i];
      if (gameObject.active) {
        gameObject.preUpdate.call(gameObject, time, delta);
      }
    }
  },
  shutdown: function () {
    var i = this._active.length;
    while (i--) {
      this._active[i].destroy(true);
    }
    i = this._pending.length;
    while (i--) {
      this._pending[i].destroy(true);
    }
    i = this._destroy.length;
    while (i--) {
      this._destroy[i].destroy(true);
    }
    this._toProcess = 0;
    this._pending = [];
    this._active = [];
    this._destroy = [];
    this.removeAllListeners();
    var eventEmitter = this.systems.events;
    eventEmitter.off(SceneEvents.PRE_UPDATE, this.update, this);
    eventEmitter.off(SceneEvents.UPDATE, this.sceneUpdate, this);
    eventEmitter.off(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  destroy: function () {
    this.shutdown();
    this.systems.events.off(SceneEvents.START, this.start, this);
    this.scene = null;
    this.systems = null;
  },
});
PluginCache.register('UpdateList', UpdateList, 'updateList');
module.exports = UpdateList;
