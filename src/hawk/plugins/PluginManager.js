var Class = require('../utils/Class');
var GameEvents = require('../core/events');
var EventEmitter = require('eventemitter3');
var FileTypesManager = require('../loader/FileTypesManager');
var GameObjectCreator = require('../gameobjects/GameObjectCreator');
var GameObjectFactory = require('../gameobjects/GameObjectFactory');
var GetFastValue = require('../utils/object/GetFastValue');
var PluginCache = require('./PluginCache');
var Remove = require('../utils/array/Remove');
var CONST = require('../const');
var PluginManager = new Class({
  Extends: EventEmitter,
  initialize: function PluginManager(game) {
    EventEmitter.call(this);
    this.game = game;
    this.plugins = [];
    this.scenePlugins = [];
    this._pendingGlobal = [];
    this._pendingScene = [];
    if (game.isBooted || game.config.renderType === CONST.HEADLESS) {
      this.boot();
    } else {
      game.events.once(GameEvents.BOOT, this.boot, this);
    }
  },
  boot: function () {
    var i;
    var entry;
    var key;
    var plugin;
    var start;
    var mapping;
    var data;
    var config = this.game.config;
    var list = config.installGlobalPlugins;
    list = list.concat(this._pendingGlobal);
    for (i = 0; i < list.length; i++) {
      entry = list[i];
      key = GetFastValue(entry, 'key', null);
      plugin = GetFastValue(entry, 'plugin', null);
      start = GetFastValue(entry, 'start', false);
      mapping = GetFastValue(entry, 'mapping', null);
      data = GetFastValue(entry, 'data', null);
      if (key) {
        if (plugin) {
          this.install(key, plugin, start, mapping, data);
        } else {
          console.warn('Missing `plugin` for key: ' + key);
        }
      }
    }
    list = config.installScenePlugins;
    list = list.concat(this._pendingScene);
    for (i = 0; i < list.length; i++) {
      entry = list[i];
      key = GetFastValue(entry, 'key', null);
      plugin = GetFastValue(entry, 'plugin', null);
      mapping = GetFastValue(entry, 'mapping', null);
      if (key) {
        if (plugin) {
          this.installScenePlugin(key, plugin, mapping);
        } else {
          console.warn('Missing `plugin` for key: ' + key);
        }
      }
    }
    this._pendingGlobal = [];
    this._pendingScene = [];
    this.game.events.once(GameEvents.DESTROY, this.destroy, this);
  },
  addToScene: function (sys, globalPlugins, scenePlugins) {
    var i;
    var pluginKey;
    var pluginList;
    var game = this.game;
    var scene = sys.scene;
    var map = sys.settings.map;
    var isBooted = sys.settings.isBooted;
    for (i = 0; i < globalPlugins.length; i++) {
      pluginKey = globalPlugins[i];
      if (game[pluginKey]) {
        sys[pluginKey] = game[pluginKey];
        if (map.hasOwnProperty(pluginKey)) {
          scene[map[pluginKey]] = sys[pluginKey];
        }
      } else if (pluginKey === 'game' && map.hasOwnProperty(pluginKey)) {
        scene[map[pluginKey]] = game;
      }
    }
    for (var s = 0; s < scenePlugins.length; s++) {
      pluginList = scenePlugins[s];
      for (i = 0; i < pluginList.length; i++) {
        pluginKey = pluginList[i];
        if (!PluginCache.hasCore(pluginKey)) {
          continue;
        }
        var source = PluginCache.getCore(pluginKey);
        var mapKey = source.mapping;
        var plugin = new source.plugin(scene, this, mapKey);
        sys[mapKey] = plugin;
        if (source.custom) {
          scene[mapKey] = plugin;
        } else if (map.hasOwnProperty(mapKey)) {
          scene[map[mapKey]] = plugin;
        }
        if (isBooted) {
          plugin.boot();
        }
      }
    }
    pluginList = this.plugins;
    for (i = 0; i < pluginList.length; i++) {
      var entry = pluginList[i];
      if (entry.mapping) {
        scene[entry.mapping] = entry.plugin;
      }
    }
  },
  getDefaultScenePlugins: function () {
    var list = this.game.config.defaultPlugins;
    list = list.concat(this.scenePlugins);
    return list;
  },
  installScenePlugin: function (key, plugin, mapping, addToScene, fromLoader) {
    if (fromLoader === undefined) {
      fromLoader = false;
    }
    if (typeof plugin !== 'function') {
      console.warn('Invalid Scene Plugin: ' + key);
      return;
    }
    if (!PluginCache.hasCore(key)) {
      PluginCache.register(key, plugin, mapping, true);
    }
    if (this.scenePlugins.indexOf(key) === -1) {
      this.scenePlugins.push(key);
    } else if (!fromLoader && PluginCache.hasCore(key)) {
      console.warn('Scene Plugin key in use: ' + key);
      return;
    }
    if (addToScene) {
      var instance = new plugin(addToScene, this, key);
      addToScene.sys[key] = instance;
      if (mapping && mapping !== '') {
        addToScene[mapping] = instance;
      }
      instance.boot();
    }
  },
  install: function (key, plugin, start, mapping, data) {
    if (start === undefined) {
      start = false;
    }
    if (mapping === undefined) {
      mapping = null;
    }
    if (data === undefined) {
      data = null;
    }
    if (typeof plugin !== 'function') {
      console.warn('Invalid Plugin: ' + key);
      return null;
    }
    if (PluginCache.hasCustom(key)) {
      console.warn('Plugin key in use: ' + key);
      return null;
    }
    if (mapping !== null) {
      start = true;
    }
    if (!this.game.isBooted) {
      this._pendingGlobal.push({
        key: key,
        plugin: plugin,
        start: start,
        mapping: mapping,
        data: data,
      });
    } else {
      PluginCache.registerCustom(key, plugin, mapping, data);
      if (start) {
        return this.start(key);
      }
    }
    return null;
  },
  getIndex: function (key) {
    var list = this.plugins;
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      if (entry.key === key) {
        return i;
      }
    }
    return -1;
  },
  getEntry: function (key) {
    var idx = this.getIndex(key);
    if (idx !== -1) {
      return this.plugins[idx];
    }
  },
  isActive: function (key) {
    var entry = this.getEntry(key);
    return entry && entry.active;
  },
  start: function (key, runAs) {
    if (runAs === undefined) {
      runAs = key;
    }
    var entry = this.getEntry(runAs);
    if (entry && !entry.active) {
      entry.active = true;
      entry.plugin.start();
    } else if (!entry) {
      entry = this.createEntry(key, runAs);
    }
    return entry ? entry.plugin : null;
  },
  createEntry: function (key, runAs) {
    var entry = PluginCache.getCustom(key);
    if (entry) {
      var instance = new entry.plugin(this);
      entry = {
        key: runAs,
        plugin: instance,
        active: true,
        mapping: entry.mapping,
        data: entry.data,
      };
      this.plugins.push(entry);
      instance.init(entry.data);
      instance.start();
    }
    return entry;
  },
  stop: function (key) {
    var entry = this.getEntry(key);
    if (entry && entry.active) {
      entry.active = false;
      entry.plugin.stop();
    }
    return this;
  },
  get: function (key, autoStart) {
    if (autoStart === undefined) {
      autoStart = true;
    }
    var entry = this.getEntry(key);
    if (entry) {
      return entry.plugin;
    } else {
      var plugin = this.getClass(key);
      if (plugin && autoStart) {
        entry = this.createEntry(key, key);
        return entry ? entry.plugin : null;
      } else if (plugin) {
        return plugin;
      }
    }
    return null;
  },
  getClass: function (key) {
    return PluginCache.getCustomClass(key);
  },
  removeGlobalPlugin: function (key) {
    var entry = this.getEntry(key);
    if (entry) {
      Remove(this.plugins, entry);
    }
    PluginCache.removeCustom(key);
  },
  removeScenePlugin: function (key) {
    Remove(this.scenePlugins, key);
    PluginCache.remove(key);
  },
  registerGameObject: function (key, factoryCallback, creatorCallback) {
    if (factoryCallback) {
      GameObjectFactory.register(key, factoryCallback);
    }
    if (creatorCallback) {
      GameObjectCreator.register(key, creatorCallback);
    }
    return this;
  },
  removeGameObject: function (key, removeFromFactory, removeFromCreator) {
    if (removeFromFactory === undefined) {
      removeFromFactory = true;
    }
    if (removeFromCreator === undefined) {
      removeFromCreator = true;
    }
    if (removeFromFactory) {
      GameObjectFactory.remove(key);
    }
    if (removeFromCreator) {
      GameObjectCreator.remove(key);
    }
    return this;
  },
  registerFileType: function (key, callback, addToScene) {
    FileTypesManager.register(key, callback);
    if (addToScene && addToScene.sys.load) {
      addToScene.sys.load[key] = callback;
    }
  },
  destroy: function () {
    for (var i = 0; i < this.plugins.length; i++) {
      this.plugins[i].plugin.destroy();
    }
    PluginCache.destroyCustomPlugins();
    if (this.game.noReturn) {
      PluginCache.destroyCorePlugins();
    }
    this.game = null;
    this.plugins = [];
    this.scenePlugins = [];
  },
});
module.exports = PluginManager;
