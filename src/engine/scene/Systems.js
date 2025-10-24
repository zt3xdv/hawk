var Class = require('../utils/Class');
var CONST = require('./const');
var DefaultPlugins = require('../plugins/DefaultPlugins');
var Events = require('./events');
var GetPhysicsPlugins = require('./GetPhysicsPlugins');
var GetScenePlugins = require('./GetScenePlugins');
var NOOP = require('../utils/NOOP');
var Settings = require('./Settings');
var Systems = new Class({
  initialize: function Systems(scene, config) {
    this.scene = scene;
    this.game;
    this.renderer;
    if (typeof PLUGIN_FBINSTANT) {
      this.facebook;
    }
    this.config = config;
    this.settings = Settings.create(config);
    this.canvas;
    this.context;
    this.anims;
    this.cache;
    this.plugins;
    this.registry;
    this.scale;
    this.sound;
    this.textures;
    this.add;
    this.cameras;
    this.displayList;
    this.events;
    this.make;
    this.scenePlugin;
    this.updateList;
    this.sceneUpdate = NOOP;
  },
  init: function (game) {
    this.settings.status = CONST.INIT;
    this.sceneUpdate = NOOP;
    this.game = game;
    this.renderer = game.renderer;
    this.canvas = game.canvas;
    this.context = game.context;
    var pluginManager = game.plugins;
    this.plugins = pluginManager;
    pluginManager.addToScene(this, DefaultPlugins.Global, [
      DefaultPlugins.CoreScene,
      GetScenePlugins(this),
      GetPhysicsPlugins(this),
    ]);
    this.events.emit(Events.BOOT, this);
    this.settings.isBooted = true;
  },
  step: function (time, delta) {
    var events = this.events;
    events.emit(Events.PRE_UPDATE, time, delta);
    events.emit(Events.UPDATE, time, delta);
    this.sceneUpdate.call(this.scene, time, delta);
    events.emit(Events.POST_UPDATE, time, delta);
  },
  render: function (renderer) {
    var displayList = this.displayList;
    displayList.depthSort();
    this.events.emit(Events.PRE_RENDER, renderer);
    this.cameras.render(renderer, displayList);
    this.events.emit(Events.RENDER, renderer);
  },
  queueDepthSort: function () {
    this.displayList.queueDepthSort();
  },
  depthSort: function () {
    this.displayList.depthSort();
  },
  pause: function (data) {
    var settings = this.settings;
    var status = this.getStatus();
    if (status !== CONST.CREATING && status !== CONST.RUNNING) {
      console.warn('Cannot pause non-running Scene', settings.key);
    } else if (this.settings.active) {
      settings.status = CONST.PAUSED;
      settings.active = false;
      this.events.emit(Events.PAUSE, this, data);
    }
    return this;
  },
  resume: function (data) {
    var events = this.events;
    var settings = this.settings;
    if (!this.settings.active) {
      settings.status = CONST.RUNNING;
      settings.active = true;
      events.emit(Events.RESUME, this, data);
    }
    return this;
  },
  sleep: function (data) {
    var settings = this.settings;
    var status = this.getStatus();
    if (status !== CONST.CREATING && status !== CONST.RUNNING) {
      console.warn('Cannot sleep non-running Scene', settings.key);
    } else {
      settings.status = CONST.SLEEPING;
      settings.active = false;
      settings.visible = false;
      this.events.emit(Events.SLEEP, this, data);
    }
    return this;
  },
  wake: function (data) {
    var events = this.events;
    var settings = this.settings;
    settings.status = CONST.RUNNING;
    settings.active = true;
    settings.visible = true;
    events.emit(Events.WAKE, this, data);
    if (settings.isTransition) {
      events.emit(
        Events.TRANSITION_WAKE,
        settings.transitionFrom,
        settings.transitionDuration,
      );
    }
    return this;
  },
  getData: function () {
    return this.settings.data;
  },
  getStatus: function () {
    return this.settings.status;
  },
  canInput: function () {
    var status = this.settings.status;
    return status > CONST.PENDING && status <= CONST.RUNNING;
  },
  isSleeping: function () {
    return this.settings.status === CONST.SLEEPING;
  },
  isActive: function () {
    return this.settings.status === CONST.RUNNING;
  },
  isPaused: function () {
    return this.settings.status === CONST.PAUSED;
  },
  isTransitioning: function () {
    return this.settings.isTransition || this.scenePlugin._target !== null;
  },
  isTransitionOut: function () {
    return this.scenePlugin._target !== null && this.scenePlugin._duration > 0;
  },
  isTransitionIn: function () {
    return this.settings.isTransition;
  },
  isVisible: function () {
    return this.settings.visible;
  },
  setVisible: function (value) {
    this.settings.visible = value;
    return this;
  },
  setActive: function (value, data) {
    if (value) {
      return this.resume(data);
    } else {
      return this.pause(data);
    }
  },
  start: function (data) {
    var events = this.events;
    var settings = this.settings;
    if (data) {
      settings.data = data;
    }
    settings.status = CONST.START;
    settings.active = true;
    settings.visible = true;
    events.emit(Events.START, this);
    events.emit(Events.READY, this, data);
  },
  shutdown: function (data) {
    var events = this.events;
    var settings = this.settings;
    events.off(Events.TRANSITION_INIT);
    events.off(Events.TRANSITION_START);
    events.off(Events.TRANSITION_COMPLETE);
    events.off(Events.TRANSITION_OUT);
    settings.status = CONST.SHUTDOWN;
    settings.active = false;
    settings.visible = false;
    events.emit(Events.SHUTDOWN, this, data);
  },
  destroy: function () {
    var events = this.events;
    var settings = this.settings;
    settings.status = CONST.DESTROYED;
    settings.active = false;
    settings.visible = false;
    events.emit(Events.DESTROY, this);
    events.removeAllListeners();
    var props = [
      'scene',
      'game',
      'anims',
      'cache',
      'plugins',
      'registry',
      'sound',
      'textures',
      'add',
      'camera',
      'displayList',
      'events',
      'make',
      'scenePlugin',
      'updateList',
    ];
    for (var i = 0; i < props.length; i++) {
      this[props[i]] = null;
    }
  },
});
module.exports = Systems;
