var Clamp = require('../math/Clamp');
var Class = require('../utils/Class');
var Events = require('./events');
var GetFastValue = require('../utils/object/GetFastValue');
var PluginCache = require('../plugins/PluginCache');
var ScenePlugin = new Class({
  initialize: function ScenePlugin(scene) {
    this.scene = scene;
    this.systems = scene.sys;
    this.settings = scene.sys.settings;
    this.key = scene.sys.settings.key;
    this.manager = scene.sys.game.scene;
    this.transitionProgress = 0;
    this._elapsed = 0;
    this._target = null;
    this._duration = 0;
    this._onUpdate;
    this._onUpdateScope;
    this._willSleep = false;
    this._willRemove = false;
    scene.sys.events.once(Events.BOOT, this.boot, this);
    scene.sys.events.on(Events.START, this.pluginStart, this);
  },
  boot: function () {
    this.systems.events.once(Events.DESTROY, this.destroy, this);
  },
  pluginStart: function () {
    this._target = null;
    this.systems.events.once(Events.SHUTDOWN, this.shutdown, this);
  },
  start: function (key, data) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.queueOp('stop', this.key);
    this.manager.queueOp('start', key, data);
    return this;
  },
  restart: function (data) {
    var key = this.key;
    this.manager.queueOp('stop', key);
    this.manager.queueOp('start', key, data);
    return this;
  },
  transition: function (config) {
    if (config === undefined) {
      config = {};
    }
    var key = GetFastValue(config, 'target', false);
    var target = this.manager.getScene(key);
    if (!key || !this.checkValidTransition(target)) {
      return false;
    }
    var duration = GetFastValue(config, 'duration', 1000);
    this._elapsed = 0;
    this._target = target;
    this._duration = duration;
    this._willSleep = GetFastValue(config, 'sleep', false);
    this._willRemove = GetFastValue(config, 'remove', false);
    var callback = GetFastValue(config, 'onUpdate', null);
    if (callback) {
      this._onUpdate = callback;
      this._onUpdateScope = GetFastValue(config, 'onUpdateScope', this.scene);
    }
    var allowInput = GetFastValue(config, 'allowInput', false);
    this.settings.transitionAllowInput = allowInput;
    var targetSettings = target.sys.settings;
    targetSettings.isTransition = true;
    targetSettings.transitionFrom = this.scene;
    targetSettings.transitionDuration = duration;
    targetSettings.transitionAllowInput = allowInput;
    if (GetFastValue(config, 'moveAbove', false)) {
      this.manager.moveAbove(this.key, key);
    } else if (GetFastValue(config, 'moveBelow', false)) {
      this.manager.moveBelow(this.key, key);
    }
    if (target.sys.isSleeping()) {
      target.sys.wake(GetFastValue(config, 'data'));
    } else {
      this.manager.start(key, GetFastValue(config, 'data'));
    }
    var onStartCallback = GetFastValue(config, 'onStart', null);
    var onStartScope = GetFastValue(config, 'onStartScope', this.scene);
    if (onStartCallback) {
      onStartCallback.call(onStartScope, this.scene, target, duration);
    }
    this.systems.events.emit(Events.TRANSITION_OUT, target, duration);
    return true;
  },
  checkValidTransition: function (target) {
    if (
      !target ||
      target.sys.isActive() ||
      target.sys.isTransitioning() ||
      target === this.scene ||
      this.systems.isTransitioning()
    ) {
      return false;
    }
    return true;
  },
  step: function (time, delta) {
    this._elapsed += delta;
    this.transitionProgress = Clamp(this._elapsed / this._duration, 0, 1);
    if (this._onUpdate) {
      this._onUpdate.call(this._onUpdateScope, this.transitionProgress);
    }
    if (this._elapsed >= this._duration) {
      this.transitionComplete();
    }
  },
  transitionComplete: function () {
    var targetSys = this._target.sys;
    var targetSettings = this._target.sys.settings;
    targetSys.events.emit(Events.TRANSITION_COMPLETE, this.scene);
    targetSettings.isTransition = false;
    targetSettings.transitionFrom = null;
    this._duration = 0;
    this._target = null;
    this._onUpdate = null;
    this._onUpdateScope = null;
    if (this._willRemove) {
      this.manager.remove(this.key);
    } else if (this._willSleep) {
      this.systems.sleep();
    } else {
      this.manager.stop(this.key);
    }
  },
  add: function (key, sceneConfig, autoStart, data) {
    return this.manager.add(key, sceneConfig, autoStart, data);
  },
  launch: function (key, data) {
    if (key && key !== this.key) {
      this.manager.queueOp('start', key, data);
    }
    return this;
  },
  run: function (key, data) {
    if (key && key !== this.key) {
      this.manager.queueOp('run', key, data);
    }
    return this;
  },
  pause: function (key, data) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.queueOp('pause', key, data);
    return this;
  },
  resume: function (key, data) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.queueOp('resume', key, data);
    return this;
  },
  sleep: function (key, data) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.queueOp('sleep', key, data);
    return this;
  },
  wake: function (key, data) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.queueOp('wake', key, data);
    return this;
  },
  switch: function (key, data) {
    if (key !== this.key) {
      this.manager.queueOp('switch', this.key, key, data);
    }
    return this;
  },
  stop: function (key, data) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.queueOp('stop', key, data);
    return this;
  },
  setActive: function (value, key, data) {
    if (key === undefined) {
      key = this.key;
    }
    var scene = this.manager.getScene(key);
    if (scene) {
      scene.sys.setActive(value, data);
    }
    return this;
  },
  setVisible: function (value, key) {
    if (key === undefined) {
      key = this.key;
    }
    var scene = this.manager.getScene(key);
    if (scene) {
      scene.sys.setVisible(value);
    }
    return this;
  },
  isSleeping: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    return this.manager.isSleeping(key);
  },
  isActive: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    return this.manager.isActive(key);
  },
  isPaused: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    return this.manager.isPaused(key);
  },
  isVisible: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    return this.manager.isVisible(key);
  },
  swapPosition: function (keyA, keyB) {
    if (keyB === undefined) {
      keyB = this.key;
    }
    if (keyA !== keyB) {
      this.manager.swapPosition(keyA, keyB);
    }
    return this;
  },
  moveAbove: function (keyA, keyB) {
    if (keyB === undefined) {
      keyB = this.key;
    }
    if (keyA !== keyB) {
      this.manager.moveAbove(keyA, keyB);
    }
    return this;
  },
  moveBelow: function (keyA, keyB) {
    if (keyB === undefined) {
      keyB = this.key;
    }
    if (keyA !== keyB) {
      this.manager.moveBelow(keyA, keyB);
    }
    return this;
  },
  remove: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.remove(key);
    return this;
  },
  moveUp: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.moveUp(key);
    return this;
  },
  moveDown: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.moveDown(key);
    return this;
  },
  bringToTop: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.bringToTop(key);
    return this;
  },
  sendToBack: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    this.manager.sendToBack(key);
    return this;
  },
  get: function (key) {
    return this.manager.getScene(key);
  },
  getStatus: function (key) {
    var scene = this.manager.getScene(key);
    if (scene) {
      return scene.sys.getStatus();
    }
  },
  getIndex: function (key) {
    if (key === undefined) {
      key = this.key;
    }
    return this.manager.getIndex(key);
  },
  shutdown: function () {
    var eventEmitter = this.systems.events;
    eventEmitter.off(Events.SHUTDOWN, this.shutdown, this);
    eventEmitter.off(Events.TRANSITION_OUT);
  },
  destroy: function () {
    this.shutdown();
    this.scene.sys.events.off(Events.START, this.start, this);
    this.scene = null;
    this.systems = null;
    this.settings = null;
    this.manager = null;
  },
});
PluginCache.register('ScenePlugin', ScenePlugin, 'scenePlugin');
module.exports = ScenePlugin;
