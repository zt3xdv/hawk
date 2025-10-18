var Between = require('../../math/Between');
var Clamp = require('../../math/Clamp');
var Class = require('../../utils/Class');
var FloatBetween = require('../../math/FloatBetween');
var GetEaseFunction = require('../../tweens/builders/GetEaseFunction');
var GetFastValue = require('../../utils/object/GetFastValue');
var GetInterpolationFunction = require('../../tweens/builders/GetInterpolationFunction');
var SnapTo = require('../../math/snap/SnapTo');
var Wrap = require('../../math/Wrap');

var EmitterOp = new Class({

    initialize:

    function EmitterOp (key, defaultValue, emitOnly)
    {
        if (emitOnly === undefined) { emitOnly = false; }

        this.propertyKey = key;

        this.propertyValue = defaultValue;

        this.defaultValue = defaultValue;

        this.steps = 0;

        this.counter = 0;

        this.yoyo = false;

        this.direction = 0;

        this.start = 0;

        this.current = 0;

        this.end = 0;

        this.ease = null;

        this.interpolation = null;

        this.emitOnly = emitOnly;

        this.onEmit = this.defaultEmit;

        this.onUpdate = this.defaultUpdate;

        this.active = true;

        this.method = 0;

        this._onEmit;

        this._onUpdate;
    },

    loadConfig: function (config, newKey)
    {
        if (config === undefined)
        {
            config = {};
        }

        if (newKey)
        {
            this.propertyKey = newKey;
        }

        this.propertyValue = GetFastValue(
            config,
            this.propertyKey,
            this.defaultValue
        );

        this.method = this.getMethod();

        this.setMethods();

        if (this.emitOnly)
        {

            this.onUpdate = this.defaultUpdate;
        }
    },

    toJSON: function ()
    {
        return JSON.stringify(this.propertyValue);
    },

    onChange: function (value)
    {
        var current;

        switch (this.method)
        {

            case 1:
            case 3:
            case 8:
                current = value;
                break;

            case 2:
                if (this.propertyValue.indexOf(value) >= 0)
                {
                    current = value;
                }
                break;

            case 4:
                var step = (this.end - this.start) / this.steps;
                current = SnapTo(value, step);
                this.counter = current;
                break;

            case 5:
            case 6:
            case 7:
                current = Clamp(value, this.start, this.end);
                break;

            case 9:
                current = this.start[0];
                break;
        }

        this.current = current;

        return this;
    },

    getMethod: function ()
    {
        var value = this.propertyValue;

        if (value === null)
        {
            return 0;
        }

        var t = typeof value;

        if (t === 'number')
        {

            return 1;
        }
        else if (Array.isArray(value))
        {

            return 2;
        }
        else if (t === 'function')
        {

            return 3;
        }
        else if (t === 'object')
        {
            if (this.hasBoth(value, 'start', 'end'))
            {
                if (this.has(value, 'steps'))
                {

                    return 4;
                }
                else
                {

                    return 5;
                }
            }
            else if (this.hasBoth(value, 'min', 'max'))
            {

                return 6;
            }
            else if (this.has(value, 'random'))
            {

                return 7;
            }
            else if (this.hasEither(value, 'onEmit', 'onUpdate'))
            {

                return 8;
            }
            else if (this.hasEither(value, 'values', 'interpolation'))
            {

                return 9;
            }
        }

        return 0;
    },

    setMethods: function ()
    {
        var value = this.propertyValue;
        var current = value;

        var onEmit = this.defaultEmit;
        var onUpdate = this.defaultUpdate;

        switch (this.method)
        {

            case 1:
                onEmit = this.staticValueEmit;
                break;

            case 2:
                onEmit = this.randomStaticValueEmit;
                current = value[0];
                break;

            case 3:
                this._onEmit = value;
                onEmit = this.proxyEmit;
                current = this.defaultValue;
                break;

            case 4:
                this.start = value.start;
                this.end = value.end;
                this.steps = value.steps;
                this.counter = this.start;
                this.yoyo = this.has(value, 'yoyo') ? value.yoyo : false;
                this.direction = 0;
                onEmit = this.steppedEmit;
                current = this.start;
                break;

            case 5:
                this.start = value.start;
                this.end = value.end;
                var easeType = this.has(value, 'ease') ? value.ease : 'Linear';
                this.ease = GetEaseFunction(easeType, value.easeParams);
                onEmit = (this.has(value, 'random') && value.random) ? this.randomRangedValueEmit : this.easedValueEmit;
                onUpdate = this.easeValueUpdate;
                current = this.start;
                break;

            case 6:
                this.start = value.min;
                this.end = value.max;
                onEmit = (this.has(value, 'int') && value.int) ? this.randomRangedIntEmit : this.randomRangedValueEmit;
                current = this.start;
                break;

            case 7:
                var rnd = value.random;

                if (Array.isArray(rnd))
                {
                    this.start = rnd[0];
                    this.end = rnd[1];
                }

                onEmit = this.randomRangedIntEmit;
                current = this.start;
                break;

            case 8:
                this._onEmit = (this.has(value, 'onEmit')) ? value.onEmit : this.defaultEmit;
                this._onUpdate = (this.has(value, 'onUpdate')) ? value.onUpdate : this.defaultUpdate;
                onEmit = this.proxyEmit;
                onUpdate = this.proxyUpdate;
                current = this.defaultValue;
                break;

            case 9:
                this.start = value.values;
                var easeTypeI = this.has(value, 'ease') ? value.ease : 'Linear';
                this.ease = GetEaseFunction(easeTypeI, value.easeParams);
                this.interpolation = GetInterpolationFunction(value.interpolation);
                onEmit = this.easedValueEmit;
                onUpdate = this.easeValueUpdate;
                current = this.start[0];
                break;
        }

        this.onEmit = onEmit;
        this.onUpdate = onUpdate;
        this.current = current;

        return this;
    },

    has: function (object, key)
    {
        return object.hasOwnProperty(key);
    },

    hasBoth: function (object, key1, key2)
    {
        return object.hasOwnProperty(key1) && object.hasOwnProperty(key2);
    },

    hasEither: function (object, key1, key2)
    {
        return object.hasOwnProperty(key1) || object.hasOwnProperty(key2);
    },

    defaultEmit: function ()
    {
        return this.defaultValue;
    },

    defaultUpdate: function (particle, key, t, value)
    {
        return value;
    },

    proxyEmit: function (particle, key, value)
    {
        var result = this._onEmit(particle, key, value);

        this.current = result;

        return result;
    },

    proxyUpdate: function (particle, key, t, value)
    {
        var result = this._onUpdate(particle, key, t, value);

        this.current = result;

        return result;
    },

    staticValueEmit: function ()
    {
        return this.current;
    },

    staticValueUpdate: function ()
    {
        return this.current;
    },

    randomStaticValueEmit: function ()
    {
        var randomIndex = Math.floor(Math.random() * this.propertyValue.length);

        this.current = this.propertyValue[randomIndex];

        return this.current;
    },

    randomRangedValueEmit: function (particle, key)
    {
        var value = FloatBetween(this.start, this.end);

        if (particle && particle.data[key])
        {
            particle.data[key].min = value;
            particle.data[key].max = this.end;
        }

        this.current = value;

        return value;
    },

    randomRangedIntEmit: function (particle, key)
    {
        var value = Between(this.start, this.end);

        if (particle && particle.data[key])
        {
            particle.data[key].min = value;
            particle.data[key].max = this.end;
        }

        this.current = value;

        return value;
    },

    steppedEmit: function ()
    {
        var current = this.counter;

        var next = current;

        var step = (this.end - this.start) / this.steps;

        if (this.yoyo)
        {
            var over;

            if (this.direction === 0)
            {

                next += step;

                if (next >= this.end)
                {
                    over = next - this.end;

                    next = this.end - over;

                    this.direction = 1;
                }
            }
            else
            {

                next -= step;

                if (next <= this.start)
                {
                    over = this.start - next;

                    next = this.start + over;

                    this.direction = 0;
                }
            }

            this.counter = next;
        }
        else
        {
            this.counter = Wrap(next + step, this.start, this.end);
        }

        this.current = current;

        return current;
    },

    easedValueEmit: function (particle, key)
    {
        if (particle && particle.data[key])
        {
            var data = particle.data[key];

            data.min = this.start;
            data.max = this.end;
        }

        this.current = this.start;

        return this.start;
    },

    easeValueUpdate: function (particle, key, t)
    {
        var data = particle.data[key];

        var current;
        var v = this.ease(t);

        if (this.interpolation)
        {
            current = this.interpolation(this.start, v);
        }
        else
        {
            current = (data.max - data.min) * v + data.min;
        }

        this.current = current;

        return current;
    },

    destroy: function ()
    {
        this.propertyValue = null;
        this.defaultValue = null;
        this.ease = null;
        this.interpolation = null;
        this._onEmit = null;
        this._onUpdate = null;
    }
});

module.exports = EmitterOp;
