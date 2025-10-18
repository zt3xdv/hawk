var Class = require('../utils/Class');
var FuzzyEqual = require('../math/fuzzy/Equal');

var Vector2 = new Class({

    initialize:

    function Vector2 (x, y)
    {

        this.x = 0;

        this.y = 0;

        if (typeof x === 'object')
        {
            this.x = x.x || 0;
            this.y = x.y || 0;
        }
        else
        {
            if (y === undefined) { y = x; }

            this.x = x || 0;
            this.y = y || 0;
        }
    },

    clone: function ()
    {
        return new Vector2(this.x, this.y);
    },

    copy: function (src)
    {
        this.x = src.x || 0;
        this.y = src.y || 0;

        return this;
    },

    setFromObject: function (obj)
    {
        this.x = obj.x || 0;
        this.y = obj.y || 0;

        return this;
    },

    set: function (x, y)
    {
        if (y === undefined) { y = x; }

        this.x = x;
        this.y = y;

        return this;
    },

    setTo: function (x, y)
    {
        return this.set(x, y);
    },

    setToPolar: function (azimuth, radius)
    {
        if (radius == null) { radius = 1; }

        this.x = Math.cos(azimuth) * radius;
        this.y = Math.sin(azimuth) * radius;

        return this;
    },

    equals: function (v)
    {
        return ((this.x === v.x) && (this.y === v.y));
    },

    fuzzyEquals: function (v, epsilon)
    {
        return (FuzzyEqual(this.x, v.x, epsilon) && FuzzyEqual(this.y, v.y, epsilon));
    },

    angle: function ()
    {

        var angle = Math.atan2(this.y, this.x);

        if (angle < 0)
        {
            angle += 2 * Math.PI;
        }

        return angle;
    },

    setAngle: function (angle)
    {
        return this.setToPolar(angle, this.length());
    },

    add: function (src)
    {
        this.x += src.x;
        this.y += src.y;

        return this;
    },

    subtract: function (src)
    {
        this.x -= src.x;
        this.y -= src.y;

        return this;
    },

    multiply: function (src)
    {
        this.x *= src.x;
        this.y *= src.y;

        return this;
    },

    scale: function (value)
    {
        if (isFinite(value))
        {
            this.x *= value;
            this.y *= value;
        }
        else
        {
            this.x = 0;
            this.y = 0;
        }

        return this;
    },

    divide: function (src)
    {
        this.x /= src.x;
        this.y /= src.y;

        return this;
    },

    negate: function ()
    {
        this.x = -this.x;
        this.y = -this.y;

        return this;
    },

    distance: function (src)
    {
        var dx = src.x - this.x;
        var dy = src.y - this.y;

        return Math.sqrt(dx * dx + dy * dy);
    },

    distanceSq: function (src)
    {
        var dx = src.x - this.x;
        var dy = src.y - this.y;

        return dx * dx + dy * dy;
    },

    length: function ()
    {
        var x = this.x;
        var y = this.y;

        return Math.sqrt(x * x + y * y);
    },

    setLength: function (length)
    {
        return this.normalize().scale(length);
    },

    lengthSq: function ()
    {
        var x = this.x;
        var y = this.y;

        return x * x + y * y;
    },

    normalize: function ()
    {
        var x = this.x;
        var y = this.y;
        var len = x * x + y * y;

        if (len > 0)
        {
            len = 1 / Math.sqrt(len);

            this.x = x * len;
            this.y = y * len;
        }

        return this;
    },

    normalizeRightHand: function ()
    {
        var x = this.x;

        this.x = this.y * -1;
        this.y = x;

        return this;
    },

    normalizeLeftHand: function ()
    {
        var x = this.x;

        this.x = this.y;
        this.y = x * -1;

        return this;
    },

    dot: function (src)
    {
        return this.x * src.x + this.y * src.y;
    },

    cross: function (src)
    {
        return this.x * src.y - this.y * src.x;
    },

    lerp: function (src, t)
    {
        if (t === undefined) { t = 0; }

        var ax = this.x;
        var ay = this.y;

        this.x = ax + t * (src.x - ax);
        this.y = ay + t * (src.y - ay);

        return this;
    },

    transformMat3: function (mat)
    {
        var x = this.x;
        var y = this.y;
        var m = mat.val;

        this.x = m[0] * x + m[3] * y + m[6];
        this.y = m[1] * x + m[4] * y + m[7];

        return this;
    },

    transformMat4: function (mat)
    {
        var x = this.x;
        var y = this.y;
        var m = mat.val;

        this.x = m[0] * x + m[4] * y + m[12];
        this.y = m[1] * x + m[5] * y + m[13];

        return this;
    },

    reset: function ()
    {
        this.x = 0;
        this.y = 0;

        return this;
    },

    limit: function (max)
    {
        var len = this.length();

        if (len && len > max)
        {
            this.scale(max / len);
        }

        return this;
    },

    reflect: function (normal)
    {
        normal = normal.clone().normalize();

        return this.subtract(normal.scale(2 * this.dot(normal)));
    },

    mirror: function (axis)
    {
        return this.reflect(axis).negate();
    },

    rotate: function (delta)
    {
        var cos = Math.cos(delta);
        var sin = Math.sin(delta);

        return this.set(cos * this.x - sin * this.y, sin * this.x + cos * this.y);
    },

    project: function (src)
    {
        var scalar = this.dot(src) / src.dot(src);

        return this.copy(src).scale(scalar);
    }

});

Vector2.ZERO = new Vector2();

Vector2.RIGHT = new Vector2(1, 0);

Vector2.LEFT = new Vector2(-1, 0);

Vector2.UP = new Vector2(0, -1);

Vector2.DOWN = new Vector2(0, 1);

Vector2.ONE = new Vector2(1, 1);

module.exports = Vector2;
