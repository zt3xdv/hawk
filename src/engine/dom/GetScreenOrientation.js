var CONST = require('../scale/const');
var GetScreenOrientation = function (width, height) {
  var screen = window.screen;
  var orientation = screen
    ? screen.orientation || screen.mozOrientation || screen.msOrientation
    : false;
  if (orientation && typeof orientation.type === 'string') {
    return orientation.type;
  } else if (typeof orientation === 'string') {
    return orientation;
  }
  if (typeof window.orientation === 'number') {
    return window.orientation === 0 || window.orientation === 180
      ? CONST.ORIENTATION.PORTRAIT
      : CONST.ORIENTATION.LANDSCAPE;
  } else if (window.matchMedia) {
    if (window.matchMedia('(orientation: portrait)').matches) {
      return CONST.ORIENTATION.PORTRAIT;
    } else if (window.matchMedia('(orientation: landscape)').matches) {
      return CONST.ORIENTATION.LANDSCAPE;
    }
  } else {
    return height > width
      ? CONST.ORIENTATION.PORTRAIT
      : CONST.ORIENTATION.LANDSCAPE;
  }
};
module.exports = GetScreenOrientation;
