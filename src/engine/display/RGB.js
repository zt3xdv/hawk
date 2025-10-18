var Class = require('../utils/Class');
var NOOP = require('../utils/NOOP');

var RGB = new Class({

    initialize:

    function RGB (red, green, blue)
    {

        this._rgb = [ 0, 0, 0 ];

        this.onChangeCallback = NOOP;

        this.dirty = false;

        this.set(red, green, blue);
    },

    set: function (red, green, blue)
    {
        if (red === undefined) { red = 0; }
        if (green === undefined) { green = 0; }
        if (blue === undefined) { blue = 0; }

        this._rgb = [ red, green, blue ];

        this.onChange();

        return this;
    },

    equals: function (red, green, blue)
    {
        var rgb = this._rgb;

        return (rgb[0] === red && rgb[1] === green && rgb[2] === blue);
    },

    onChange: function ()
    {
        this.dirty = true;

        var rgb = this._rgb;

        this.onChangeCallback.call(this, rgb[0], rgb[1], rgb[2]);
    },

    r: {

        get: function ()
        {
            return this._rgb[0];
        },

        set: function (value)
        {
            this._rgb[0] = value;
            this.onChange();
        }

    },

    g: {

        get: function ()
        {
            return this._rgb[1];
        },

        set: function (value)
        {
            this._rgb[1] = value;
            this.onChange();
        }

    },

    b: {

        get: function ()
        {
            return this._rgb[2];
        },

        set: function (value)
        {
            this._rgb[2] = value;
            this.onChange();
        }

    },

    destroy: function ()
    {
        this.onChangeCallback = null;
    }

});

module.exports = RGB;
