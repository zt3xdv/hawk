var types = {};
var FileTypesManager = {
  install: function (loader) {
    for (var key in types) {
      loader[key] = types[key];
    }
  },
  register: function (key, factoryFunction) {
    types[key] = factoryFunction;
  },
  destroy: function () {
    types = {};
  },
};
module.exports = FileTypesManager;
