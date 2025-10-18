var Class = require('../../utils/Class');
var Components = require('./components');
var Image = require('../../gameobjects/image/Image');

var ArcadeImage = new Class({

    Extends: Image,

    Mixins: [
        Components.Acceleration,
        Components.Angular,
        Components.Bounce,
        Components.Collision,
        Components.Debug,
        Components.Drag,
        Components.Enable,
        Components.Friction,
        Components.Gravity,
        Components.Immovable,
        Components.Mass,
        Components.Pushable,
        Components.Size,
        Components.Velocity
    ],

    initialize:

    function ArcadeImage (scene, x, y, texture, frame)
    {
        Image.call(this, scene, x, y, texture, frame);

        this.body = null;
    }

});

module.exports = ArcadeImage;
