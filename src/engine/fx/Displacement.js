var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');

var Displacement = new Class({

    Extends: Controller,

    initialize:

    function Displacement (gameObject, texture, x, y)
    {
        if (texture === undefined) { texture = '__WHITE'; }
        if (x === undefined) { x = 0.005; }
        if (y === undefined) { y = 0.005; }

        Controller.call(this, FX_CONST.DISPLACEMENT, gameObject);

        this.x = x;

        this.y = y;

        this.glTexture;

        this.setTexture(texture);
    },

    setTexture: function (texture)
    {
        var hawkTexture = this.gameObject.scene.sys.textures.getFrame(texture);

        if (hawkTexture)
        {
            this.glTexture = hawkTexture.glTexture;
        }

        return this;
    }

});

module.exports = Displacement;
