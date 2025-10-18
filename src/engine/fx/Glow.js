var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');

var Glow = new Class({

    Extends: Controller,

    initialize:

    function Glow (gameObject, color, outerStrength, innerStrength, knockout)
    {
        if (outerStrength === undefined) { outerStrength = 4; }
        if (innerStrength === undefined) { innerStrength = 0; }
        if (knockout === undefined) { knockout = false; }

        Controller.call(this, FX_CONST.GLOW, gameObject);

        this.outerStrength = outerStrength;

        this.innerStrength = innerStrength;

        this.knockout = knockout;

        this.glcolor = [ 1, 1, 1, 1 ];

        if (color !== undefined)
        {
            this.color = color;
        }
    },

    color: {

        get: function ()
        {
            var color = this.glcolor;

            return (((color[0] * 255) << 16) + ((color[1] * 255) << 8) + (color[2] * 255 | 0));
        },

        set: function (value)
        {
            var color = this.glcolor;

            color[0] = ((value >> 16) & 0xFF) / 255;
            color[1] = ((value >> 8) & 0xFF) / 255;
            color[2] = (value & 0xFF) / 255;
        }

    }

});

module.exports = Glow;
