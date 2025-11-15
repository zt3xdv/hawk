var Class = require('../utils/Class');
var List = require('../structs/List');
var PluginCache = require('../plugins/PluginCache');
var GameObjectEvents = require('./events');
var SceneEvents = require('../scene/events');
var StableSort = require('../utils/array/StableSort');
var DisplayList = new Class({
  Extends: List,
  initialize: function DisplayList(scene) {
    List.call(this, scene);
    this.sortChildrenFlag = false;
    this.scene = scene;
    this.systems = scene.sys;
    this.events = scene.sys.events;
    this.addCallback = this.addChildCallback;
    this.removeCallback = this.removeChildCallback;
    this.events.once(SceneEvents.BOOT, this.boot, this);
    this.events.on(SceneEvents.START, this.start, this);
  },
  boot: function () {
    this.events.once(SceneEvents.DESTROY, this.destroy, this);
  },
  addChildCallback: function (gameObject) {
    if (gameObject.displayList && gameObject.displayList !== this) {
      gameObject.removeFromDisplayList();
    }
    if (gameObject.parentContainer) {
      gameObject.parentContainer.remove(gameObject);
    }
    if (!gameObject.displayList) {
      this.queueDepthSort();
      gameObject.displayList = this;
      gameObject.emit(GameObjectEvents.ADDED_TO_SCENE, gameObject, this.scene);
      this.events.emit(SceneEvents.ADDED_TO_SCENE, gameObject, this.scene);
    }
  },
  removeChildCallback: function (gameObject) {
    this.queueDepthSort();
    gameObject.displayList = null;
    gameObject.emit(
      GameObjectEvents.REMOVED_FROM_SCENE,
      gameObject,
      this.scene,
    );
    this.events.emit(SceneEvents.REMOVED_FROM_SCENE, gameObject, this.scene);
  },
  start: function () {
    this.events.once(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  queueDepthSort: function () {
    this.sortChildrenFlag = true;
  },
  depthSort: function () {
    if (this.sortChildrenFlag) {
      this.list.sort(this.sortByDepth);
    }
  },
  sortByDepth: function (childA, childB) {
    return childA._depth - childB._depth;
  },
  getChildren: function () {
    return this.list;
  },
  shutdown: function () {
    var list = this.list;
    var i = list.length;
    while (i--) {
      if (list[i]) {
        list[i].destroy(true);
      }
    }
    list.length = 0;
    this.events.off(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  destroy: function () {
    this.shutdown();
    this.events.off(SceneEvents.START, this.start, this);
    this.scene = null;
    this.systems = null;
    this.events = null;
  },
});
PluginCache.register('DisplayList', DisplayList, 'displayList');
module.exports = DisplayList;
