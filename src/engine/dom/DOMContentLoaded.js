var OS = require('../device/OS');
var DOMContentLoaded = function (callback) {
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    callback();
    return;
  }
  var check = function () {
    document.removeEventListener('deviceready', check, true);
    document.removeEventListener('DOMContentLoaded', check, true);
    window.removeEventListener('load', check, true);
    callback();
  };
  if (!document.body) {
    window.setTimeout(check, 20);
  } else if (OS.cordova) {
    document.addEventListener('deviceready', check, false);
  } else {
    document.addEventListener('DOMContentLoaded', check, true);
    window.addEventListener('load', check, true);
  }
};
module.exports = DOMContentLoaded;
