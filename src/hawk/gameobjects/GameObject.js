var Class = require('../utils/Class');
var ComponentsToJSON = require('./components/ToJSON');
var DataManager = require('../data/DataManager');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var SceneEvents = require('../scene/events');
var GameObject = new Class({
  Extends: EventEmitter,
  initialize: function GameObject(scene, type) {
    EventEmitter.call(this);
    this.scene = scene;
    this.displayList = null;
    this.type = type;
    this.state = 0;
    this.parentContainer = null;
    this.name = '';
    this.active = true;
    this.tabIndex = -1;
    this.data = null;
    this.renderFlags = 15;
    this.cameraFilter = 0;
    this.input = null;
    this.body = null;
    this.ignoreDestroy = false;
    this.on(Events.ADDED_TO_SCENE, this.addedToScene, this);
    this.on(Events.REMOVED_FROM_SCENE, this.removedFromScene, this);
    scene.sys.queueDepthSort();
  },
  setActive: function (value) {
    this.active = value;
    return this;
  },
  setName: function (value) {
    this.name = value;
    return this;
  },
  setState: function (value) {
    this.state = value;
    return this;
  },
  setDataEnabled: function () {
    if (!this.data) {
      this.data = new DataManager(this);
    }
    return this;
  },
  setData: function (key, value) {
    if (!this.data) {
      this.data = new DataManager(this);
    }
    this.data.set(key, value);
    return this;
  },
  incData: function (key, amount) {
    if (!this.data) {
      this.data = new DataManager(this);
    }
    this.data.inc(key, amount);
    return this;
  },
  toggleData: function (key) {
    if (!this.data) {
      this.data = new DataManager(this);
    }
    this.data.toggle(key);
    return this;
  },
  getData: function (key) {
    if (!this.data) {
      this.data = new DataManager(this);
    }
    return this.data.get(key);
  },
  setInteractive: function (hitArea, hitAreaCallback, dropZone) {
    this.scene.sys.input.enable(this, hitArea, hitAreaCallback, dropZone);
    return this;
  },
  disableInteractive: function (resetCursor) {
    if (resetCursor === undefined) {
      resetCursor = false;
    }
    this.scene.sys.input.disable(this, resetCursor);
    return this;
  },
  removeInteractive: function (resetCursor) {
    if (resetCursor === undefined) {
      resetCursor = false;
    }
    this.scene.sys.input.clear(this);
    if (resetCursor) {
      this.scene.sys.input.resetCursor();
    }
    this.input = undefined;
    return this;
  },
  addedToScene: function () {},
  removedFromScene: function () {},
  update: function () {},
  toJSON: function () {
    return ComponentsToJSON(this);
  },
  willRender: function (camera) {
    var listWillRender =
      this.displayList && this.displayList.active
        ? this.displayList.willRender(camera)
        : true;
    return !(
      !listWillRender ||
      GameObject.RENDER_MASK !== this.renderFlags ||
      (this.cameraFilter !== 0 && this.cameraFilter & camera.id)
    );
  },
  getIndexList: function () {
    var child = this;
    var parent = this.parentContainer;
    var indexes = [];
    while (parent) {
      indexes.unshift(parent.getIndex(child));
      child = parent;
      if (!parent.parentContainer) {
        break;
      } else {
        parent = parent.parentContainer;
      }
    }
    if (this.displayList) {
      indexes.unshift(this.displayList.getIndex(child));
    } else {
      indexes.unshift(this.scene.sys.displayList.getIndex(child));
    }
    return indexes;
  },
  addToDisplayList: function (displayList) {
    if (displayList === undefined) {
      displayList = this.scene.sys.displayList;
    }
    if (this.displayList && this.displayList !== displayList) {
      this.removeFromDisplayList();
    }
    if (!displayList.exists(this)) {
      this.displayList = displayList;
      displayList.add(this, true);
      displayList.queueDepthSort();
      this.emit(Events.ADDED_TO_SCENE, this, this.scene);
      displayList.events.emit(SceneEvents.ADDED_TO_SCENE, this, this.scene);
    }
    return this;
  },
  addToUpdateList: function () {
    if (this.scene && this.preUpdate) {
      this.scene.sys.updateList.add(this);
    }
    return this;
  },
  removeFromDisplayList: function () {
    var displayList = this.displayList || this.scene.sys.displayList;
    if (displayList && displayList.exists(this)) {
      displayList.remove(this, true);
      displayList.queueDepthSort();
      this.displayList = null;
      this.emit(Events.REMOVED_FROM_SCENE, this, this.scene);
      displayList.events.emit(SceneEvents.REMOVED_FROM_SCENE, this, this.scene);
    }
    return this;
  },
  removeFromUpdateList: function () {
    if (this.scene && this.preUpdate) {
      this.scene.sys.updateList.remove(this);
    }
    return this;
  },
  getDisplayList: function () {
    var list = null;
    if (this.parentContainer) {
      list = this.parentContainer.list;
    } else if (this.displayList) {
      list = this.displayList.list;
    }
    return list;
  },
  destroy: function (fromScene) {
    if (!this.scene || this.ignoreDestroy) {
      return;
    }
    if (fromScene === undefined) {
      fromScene = false;
    }
    if (this.preDestroy) {
      this.preDestroy.call(this);
    }
    this.emit(Events.DESTROY, this, fromScene);
    this.removeAllListeners();
    if (this.postPipelines) {
      this.resetPostPipeline(true);
    }
    this.removeFromDisplayList();
    this.removeFromUpdateList();
    if (this.input) {
      this.scene.sys.input.clear(this);
      this.input = undefined;
    }
    if (this.data) {
      this.data.destroy();
      this.data = undefined;
    }
    if (this.body) {
      this.body.destroy();
      this.body = undefined;
    }
    if (this.preFX) {
      this.preFX.destroy();
      this.preFX = undefined;
    }
    if (this.postFX) {
      this.postFX.destroy();
      this.postFX = undefined;
    }
    this.active = false;
    this.visible = false;
    this.scene = undefined;
    this.parentContainer = undefined;
  },
});
GameObject.RENDER_MASK = 15;
module.exports = GameObject;
