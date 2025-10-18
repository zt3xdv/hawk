var CONST = require('./const');
var Extend = require('../utils/object/Extend');

var Scene = {

    Events: require('./events'),
    GetPhysicsPlugins: require('./GetPhysicsPlugins'),
    GetScenePlugins: require('./GetScenePlugins'),
    SceneManager: require('./SceneManager'),
    ScenePlugin: require('./ScenePlugin'),
    Settings: require('./Settings'),
    Systems: require('./Systems')

};

Scene = Extend(false, Scene, CONST);

module.exports = Scene;
