var Extend = require('../utils/object/Extend');
var CONST = require('./const');
var Scale = {
  Center: require('./const/CENTER_CONST'),
  Events: require('./events'),
  Orientation: require('./const/ORIENTATION_CONST'),
  ScaleManager: require('./ScaleManager'),
  ScaleModes: require('./const/SCALE_MODE_CONST'),
  Zoom: require('./const/ZOOM_CONST'),
};
Scale = Extend(false, Scale, CONST.CENTER);
Scale = Extend(false, Scale, CONST.ORIENTATION);
Scale = Extend(false, Scale, CONST.SCALE_MODE);
Scale = Extend(false, Scale, CONST.ZOOM);
module.exports = Scale;
