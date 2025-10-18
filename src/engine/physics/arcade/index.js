var CONST = require('./const');
var Extend = require('../../utils/object/Extend');

var Arcade = {

    ArcadePhysics: require('./ArcadePhysics'),
    Body: require('./Body'),
    Collider: require('./Collider'),
    Components: require('./components'),
    Events: require('./events'),
    Factory: require('./Factory'),
    GetCollidesWith: require('./GetCollidesWith'),
    GetOverlapX: require('./GetOverlapX'),
    GetOverlapY: require('./GetOverlapY'),
    SeparateX: require('./SeparateX'),
    SeparateY: require('./SeparateY'),
    Group: require('./PhysicsGroup'),
    Image: require('./ArcadeImage'),
    Sprite: require('./ArcadeSprite'),
    StaticBody: require('./StaticBody'),
    StaticGroup: require('./StaticPhysicsGroup'),
    Tilemap: require('./tilemap/'),
    World: require('./World')

};

Arcade = Extend(false, Arcade, CONST);

module.exports = Arcade;
