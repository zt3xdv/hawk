var CONST = require('./const');
var Extend = require('../utils/object/Extend');
var Input = {
  CreatePixelPerfectHandler: require('./CreatePixelPerfectHandler'),
  CreateInteractiveObject: require('./CreateInteractiveObject'),
  Events: require('./events'),
  Gamepad: require('./gamepad'),
  InputManager: require('./InputManager'),
  InputPlugin: require('./InputPlugin'),
  InputPluginCache: require('./InputPluginCache'),
  Keyboard: require('./keyboard'),
  Mouse: require('./mouse'),
  Pointer: require('./Pointer'),
  Touch: require('./touch'),
};
Input = Extend(false, Input, CONST);
module.exports = Input;
