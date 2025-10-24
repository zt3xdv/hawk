var GetValue = require('../utils/object/GetValue');
var inputPlugins = {};
var InputPluginCache = {};
InputPluginCache.register = function (
  key,
  plugin,
  mapping,
  settingsKey,
  configKey,
) {
  inputPlugins[key] = {
    plugin: plugin,
    mapping: mapping,
    settingsKey: settingsKey,
    configKey: configKey,
  };
};
InputPluginCache.getPlugin = function (key) {
  return inputPlugins[key];
};
InputPluginCache.install = function (target) {
  var sys = target.scene.sys;
  var settings = sys.settings.input;
  var config = sys.game.config;
  for (var key in inputPlugins) {
    var source = inputPlugins[key].plugin;
    var mapping = inputPlugins[key].mapping;
    var settingsKey = inputPlugins[key].settingsKey;
    var configKey = inputPlugins[key].configKey;
    if (GetValue(settings, settingsKey, config[configKey])) {
      target[mapping] = new source(target);
    }
  }
};
InputPluginCache.remove = function (key) {
  if (inputPlugins.hasOwnProperty(key)) {
    delete inputPlugins[key];
  }
};
module.exports = InputPluginCache;
