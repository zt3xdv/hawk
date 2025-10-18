var Class = require('../../utils/Class');
var EmitterOp = require('./EmitterOp');
var GetColor = require('../../display/color/GetColor');
var GetEaseFunction = require('../../tweens/builders/GetEaseFunction');
var GetInterpolationFunction = require('../../tweens/builders/GetInterpolationFunction');
var IntegerToRGB = require('../../display/color/IntegerToRGB');

var EmitterColorOp = new Class({

    Extends: EmitterOp,

    initialize:

    function EmitterColorOp (key)
    {
        EmitterOp.call(this, key, null, false);

        this.active = false;

        this.easeName = 'Linear';

        this.r = [];

        this.g = [];

        this.b = [];
    },

    getMethod: function ()
    {
        return (this.propertyValue === null) ? 0 : 9;
    },

    setMethods: function ()
    {
        var value = this.propertyValue;
        var current = value;

        var onEmit = this.defaultEmit;
        var onUpdate = this.defaultUpdate;

        if (this.method === 9)
        {
            this.start = value[0];
            this.ease = GetEaseFunction('Linear');
            this.interpolation = GetInterpolationFunction('linear');

            onEmit = this.easedValueEmit;
            onUpdate = this.easeValueUpdate;
            current = value[0];

            this.active = true;

            this.r.length = 0;
            this.g.length = 0;
            this.b.length = 0;

            for (var i = 0; i < value.length; i++)
            {

                var color = IntegerToRGB(value[i]);

                this.r.push(color.r);
                this.g.push(color.g);
                this.b.push(color.b);
            }
        }

        this.onEmit = onEmit;
        this.onUpdate = onUpdate;
        this.current = current;

        return this;
    },

    setEase: function (value)
    {
        this.easeName = value;

        this.ease = GetEaseFunction(value);
    },

    easedValueEmit: function ()
    {
        this.current = this.start;

        return this.start;
    },

    easeValueUpdate: function (particle, key, t)
    {
        var v = this.ease(t);

        var r = this.interpolation(this.r, v);
        var g = this.interpolation(this.g, v);
        var b = this.interpolation(this.b, v);

        var current = GetColor(r, g, b);

        this.current = current;

        return current;
    }

});

module.exports = EmitterColorOp;
