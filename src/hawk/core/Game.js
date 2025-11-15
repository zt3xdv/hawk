var AddToDOM = require('../dom/AddToDOM');
var AnimationManager = require('../animations/AnimationManager');
var CacheManager = require('../cache/CacheManager');
var CanvasPool = require('../display/canvas/CanvasPool');
var Class = require('../utils/Class');
var Config = require('./Config');
var CreateDOMContainer = require('../dom/CreateDOMContainer');
var CreateRenderer = require('./CreateRenderer');
var DataManager = require('../data/DataManager');
var Device = require('../device');
var DOMContentLoaded = require('../dom/DOMContentLoaded');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var InputManager = require('../input/InputManager');
var PluginCache = require('../plugins/PluginCache');
var PluginManager = require('../plugins/PluginManager');
var ScaleManager = require('../scale/ScaleManager');
var SceneManager = require('../scene/SceneManager');
var TextureEvents = require('../textures/events');
var TextureManager = require('../textures/TextureManager');
var TimeStep = require('./TimeStep');
var VisibilityHandler = require('./VisibilityHandler');
var Game = new Class({
  initialize: function Game(config) {
    this.config = new Config(config);
    this.renderer = null;
    this.domContainer = null;
    this.canvas = null;
    this.context = null;
    this.isBooted = false;
    this.isRunning = false;
    this.events = new EventEmitter();
    this.anims = new AnimationManager(this);
    this.textures = new TextureManager(this);
    this.cache = new CacheManager(this);
    this.registry = new DataManager(this, new EventEmitter());
    this.input = new InputManager(this, this.config);
    this.scene = new SceneManager(this, this.config.sceneConfig);
    this.device = Device;
    this.scale = new ScaleManager(this, this.config);
    this.sound = null;
    this.loop = new TimeStep(this, this.config.fps);
    this.plugins = new PluginManager(this, this.config);
    this.pendingDestroy = false;
    this.removeCanvas = false;
    this.noReturn = false;
    this.hasFocus = false;
    this.isPaused = false;
    DOMContentLoaded(this.boot.bind(this));
  },
  boot: function () {
    if (!PluginCache.hasCore('EventEmitter')) {
      console.warn('Aborting. Core Plugins missing.');
      //return;
    }
    this.isBooted = true;
    this.config.preBoot(this);
    this.scale.preBoot();
    CreateRenderer(this);
    CreateDOMContainer(this);
    AddToDOM(this.canvas, this.config.parent);
    this.textures.once(TextureEvents.READY, this.texturesReady, this);
    this.events.emit(Events.BOOT);
    if (typeof WEBGL_DEBUG && window) {
      window.PHASER_GAME = this;
    }
  },
  texturesReady: function () {
    this.events.emit(Events.READY);
    this.start();
  },
  start: function () {
    this.isRunning = true;
    this.config.postBoot(this);
    if (this.renderer) {
      this.loop.start(this.step.bind(this));
    } else {
      this.loop.start(this.headlessStep.bind(this));
    }
    VisibilityHandler(this);
    var eventEmitter = this.events;
    eventEmitter.on(Events.HIDDEN, this.onHidden, this);
    eventEmitter.on(Events.VISIBLE, this.onVisible, this);
    eventEmitter.on(Events.BLUR, this.onBlur, this);
    eventEmitter.on(Events.FOCUS, this.onFocus, this);
  },
  step: function (time, delta) {
    if (this.pendingDestroy) {
      return this.runDestroy();
    }
    if (this.isPaused) {
      return;
    }
    var eventEmitter = this.events;
    eventEmitter.emit(Events.PRE_STEP, time, delta);
    eventEmitter.emit(Events.STEP, time, delta);
    this.scene.update(time, delta);
    eventEmitter.emit(Events.POST_STEP, time, delta);
    var renderer = this.renderer;
    renderer.preRender();
    eventEmitter.emit(Events.PRE_RENDER, renderer, time, delta);
    this.scene.render(renderer);
    renderer.postRender();
    eventEmitter.emit(Events.POST_RENDER, renderer, time, delta);
  },
  headlessStep: function (time, delta) {
    if (this.pendingDestroy) {
      return this.runDestroy();
    }
    if (this.isPaused) {
      return;
    }
    var eventEmitter = this.events;
    eventEmitter.emit(Events.PRE_STEP, time, delta);
    eventEmitter.emit(Events.STEP, time, delta);
    this.scene.update(time, delta);
    eventEmitter.emit(Events.POST_STEP, time, delta);
    this.scene.isProcessing = false;
    eventEmitter.emit(Events.PRE_RENDER, null, time, delta);
    eventEmitter.emit(Events.POST_RENDER, null, time, delta);
  },
  onHidden: function () {
    this.loop.pause();
    this.events.emit(Events.PAUSE);
  },
  pause: function () {
    var wasPaused = this.isPaused;
    this.isPaused = true;
    if (!wasPaused) {
      this.events.emit(Events.PAUSE);
    }
  },
  onVisible: function () {
    this.loop.resume();
    this.events.emit(Events.RESUME, this.loop.pauseDuration);
  },
  resume: function () {
    var wasPaused = this.isPaused;
    this.isPaused = false;
    if (wasPaused) {
      this.events.emit(Events.RESUME, 0);
    }
  },
  onBlur: function () {
    this.hasFocus = false;
    this.loop.blur();
  },
  onFocus: function () {
    this.hasFocus = true;
    this.loop.focus();
  },
  getFrame: function () {
    return this.loop.frame;
  },
  getTime: function () {
    return this.loop.lastTime;
  },
  destroy: function (removeCanvas, noReturn) {
    if (noReturn === undefined) {
      noReturn = false;
    }
    this.pendingDestroy = true;
    this.removeCanvas = removeCanvas;
    this.noReturn = noReturn;
  },
  runDestroy: function () {
    this.scene.destroy();
    this.events.emit(Events.DESTROY);
    this.events.removeAllListeners();
    if (this.renderer) {
      this.renderer.destroy();
    }
    if (this.removeCanvas && this.canvas) {
      CanvasPool.remove(this.canvas);
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
    if (this.domContainer && this.domContainer.parentNode) {
      this.domContainer.parentNode.removeChild(this.domContainer);
    }
    this.loop.destroy();
    this.pendingDestroy = false;
  },
});
module.exports = Game;
