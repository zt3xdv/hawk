var CONST = require('./const');
var GetValue = require('../utils/object/GetValue');
var Merge = require('../utils/object/Merge');
var InjectionMap = require('./InjectionMap');
var Settings = {
  create: function (config) {
    if (typeof config === 'string') {
      config = { key: config };
    } else if (config === undefined) {
      config = {};
    }
    return {
      status: CONST.PENDING,
      key: GetValue(config, 'key', ''),
      active: GetValue(config, 'active', false),
      visible: GetValue(config, 'visible', true),
      isBooted: false,
      isTransition: false,
      transitionFrom: null,
      transitionDuration: 0,
      transitionAllowInput: true,
      data: {},
      pack: GetValue(config, 'pack', false),
      cameras: GetValue(config, 'cameras', null),
      map: GetValue(
        config,
        'map',
        Merge(InjectionMap, GetValue(config, 'mapAdd', {})),
      ),
      physics: GetValue(config, 'physics', {}),
      loader: GetValue(config, 'loader', {}),
      plugins: GetValue(config, 'plugins', false),
      input: GetValue(config, 'input', {}),
    };
  },
};
module.exports = Settings;
