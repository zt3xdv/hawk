var GetFastValue = require('../utils/object/GetFastValue');
var GetScenePlugins = function (sys) {
  var defaultPlugins = sys.plugins.getDefaultScenePlugins();
  var scenePlugins = GetFastValue(sys.settings, 'plugins', false);
  if (Array.isArray(scenePlugins)) {
    return scenePlugins;
  } else if (defaultPlugins) {
    return defaultPlugins;
  } else {
    return [];
  }
};
module.exports = GetScenePlugins;
