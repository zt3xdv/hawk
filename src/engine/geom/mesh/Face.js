var Class = require('../../utils/Class');
var Rectangle = require('../rectangle/Rectangle');
var Vector2 = require('../../math/Vector2');

function GetLength (x1, y1, x2, y2)
{
    var x = x1 - x2;
    var y = y1 - y2;
    var magnitude = (x * x) + (y * y);

    return Math.sqrt(magnitude);
}

var Face = new Class({

    initialize:

    function Face (vertex1, vertex2, vertex3)
    {

        this.vertex1 = vertex1;

        this.vertex2 = vertex2;

        this.vertex3 = vertex3;

        this.bounds = new Rectangle();

        this._inCenter = new Vector2();
    },

    getInCenter: function (local)
    {
        if (local === undefined) { local = true; }

        var v1 = this.vertex1;
        var v2 = this.vertex2;
        var v3 = this.vertex3;

        var v1x;
        var v1y;

        var v2x;
        var v2y;

        var v3x;
        var v3y;

        if (local)
        {
            v1x = v1.x;
            v1y = v1.y;

            v2x = v2.x;
            v2y = v2.y;

            v3x = v3.x;
            v3y = v3.y;
        }
        else
        {
            v1x = v1.vx;
            v1y = v1.vy;

            v2x = v2.vx;
            v2y = v2.vy;

            v3x = v3.vx;
            v3y = v3.vy;
        }

        var d1 = GetLength(v3x, v3y, v2x, v2y);
        var d2 = GetLength(v1x, v1y, v3x, v3y);
        var d3 = GetLength(v2x, v2y, v1x, v1y);

        var p = d1 + d2 + d3;

        return this._inCenter.set(
            (v1x * d1 + v2x * d2 + v3x * d3) / p,
            (v1y * d1 + v2y * d2 + v3y * d3) / p
        );
    },

    contains: function (x, y, calcMatrix)
    {
        var vertex1 = this.vertex1;
        var vertex2 = this.vertex2;
        var vertex3 = this.vertex3;

        var v1x = vertex1.vx;
        var v1y = vertex1.vy;

        var v2x = vertex2.vx;
        var v2y = vertex2.vy;

        var v3x = vertex3.vx;
        var v3y = vertex3.vy;

        if (calcMatrix)
        {
            var a = calcMatrix.a;
            var b = calcMatrix.b;
            var c = calcMatrix.c;
            var d = calcMatrix.d;
            var e = calcMatrix.e;
            var f = calcMatrix.f;

            v1x = vertex1.vx * a + vertex1.vy * c + e;
            v1y = vertex1.vx * b + vertex1.vy * d + f;

            v2x = vertex2.vx * a + vertex2.vy * c + e;
            v2y = vertex2.vx * b + vertex2.vy * d + f;

            v3x = vertex3.vx * a + vertex3.vy * c + e;
            v3y = vertex3.vx * b + vertex3.vy * d + f;
        }

        var t0x = v3x - v1x;
        var t0y = v3y - v1y;

        var t1x = v2x - v1x;
        var t1y = v2y - v1y;

        var t2x = x - v1x;
        var t2y = y - v1y;

        var dot00 = (t0x * t0x) + (t0y * t0y);
        var dot01 = (t0x * t1x) + (t0y * t1y);
        var dot02 = (t0x * t2x) + (t0y * t2y);
        var dot11 = (t1x * t1x) + (t1y * t1y);
        var dot12 = (t1x * t2x) + (t1y * t2y);

        var bc = ((dot00 * dot11) - (dot01 * dot01));
        var inv = (bc === 0) ? 0 : (1 / bc);
        var u = ((dot11 * dot02) - (dot01 * dot12)) * inv;
        var v = ((dot00 * dot12) - (dot01 * dot02)) * inv;

        return (u >= 0 && v >= 0 && (u + v < 1));
    },

    isCounterClockwise: function (z)
    {
        var v1 = this.vertex1;
        var v2 = this.vertex2;
        var v3 = this.vertex3;

        var d = (v2.vx - v1.vx) * (v3.vy - v1.vy) - (v2.vy - v1.vy) * (v3.vx - v1.vx);

        return (z <= 0) ? d >= 0 : d < 0;
    },

    load: function (F32, U32, offset, textureUnit, tintEffect)
    {
        offset = this.vertex1.load(F32, U32, offset, textureUnit, tintEffect);
        offset = this.vertex2.load(F32, U32, offset, textureUnit, tintEffect);
        offset = this.vertex3.load(F32, U32, offset, textureUnit, tintEffect);

        return offset;
    },

    transformCoordinatesLocal: function (transformMatrix, width, height, cameraZ)
    {
        this.vertex1.transformCoordinatesLocal(transformMatrix, width, height, cameraZ);
        this.vertex2.transformCoordinatesLocal(transformMatrix, width, height, cameraZ);
        this.vertex3.transformCoordinatesLocal(transformMatrix, width, height, cameraZ);

        return this;
    },

    updateBounds: function ()
    {
        var v1 = this.vertex1;
        var v2 = this.vertex2;
        var v3 = this.vertex3;

        var bounds = this.bounds;

        bounds.x = Math.min(v1.vx, v2.vx, v3.vx);
        bounds.y = Math.min(v1.vy, v2.vy, v3.vy);
        bounds.width = Math.max(v1.vx, v2.vx, v3.vx) - bounds.x;
        bounds.height = Math.max(v1.vy, v2.vy, v3.vy) - bounds.y;

        return this;
    },

    isInView: function (camera, hideCCW, z, alpha, a, b, c, d, e, f, roundPixels)
    {
        this.update(alpha, a, b, c, d, e, f, roundPixels);

        var v1 = this.vertex1;
        var v2 = this.vertex2;
        var v3 = this.vertex3;

        if (v1.ta <= 0 && v2.ta <= 0 && v3.ta <= 0)
        {
            return false;
        }

        if (hideCCW && !this.isCounterClockwise(z))
        {
            return false;
        }

        var bounds = this.bounds;

        bounds.x = Math.min(v1.tx, v2.tx, v3.tx);
        bounds.y = Math.min(v1.ty, v2.ty, v3.ty);
        bounds.width = Math.max(v1.tx, v2.tx, v3.tx) - bounds.x;
        bounds.height = Math.max(v1.ty, v2.ty, v3.ty) - bounds.y;

        var cr = camera.x + camera.width;
        var cb = camera.y + camera.height;

        if (bounds.width <= 0 || bounds.height <= 0 || camera.width <= 0 || camera.height <= 0)
        {
            return false;
        }

        return !(bounds.right < camera.x || bounds.bottom < camera.y || bounds.x > cr || bounds.y > cb);
    },

    scrollUV: function (x, y)
    {
        this.vertex1.scrollUV(x, y);
        this.vertex2.scrollUV(x, y);
        this.vertex3.scrollUV(x, y);

        return this;
    },

    scaleUV: function (x, y)
    {
        this.vertex1.scaleUV(x, y);
        this.vertex2.scaleUV(x, y);
        this.vertex3.scaleUV(x, y);

        return this;
    },

    setColor: function (color)
    {
        this.vertex1.color = color;
        this.vertex2.color = color;
        this.vertex3.color = color;

        return this;
    },

    update: function (alpha, a, b, c, d, e, f, roundPixels)
    {
        this.vertex1.update(a, b, c, d, e, f, roundPixels, alpha);
        this.vertex2.update(a, b, c, d, e, f, roundPixels, alpha);
        this.vertex3.update(a, b, c, d, e, f, roundPixels, alpha);

        return this;
    },

    translate: function (x, y)
    {
        if (y === undefined) { y = 0; }

        var v1 = this.vertex1;
        var v2 = this.vertex2;
        var v3 = this.vertex3;

        v1.x += x;
        v1.y += y;

        v2.x += x;
        v2.y += y;

        v3.x += x;
        v3.y += y;

        return this;
    },

    x: {

        get: function ()
        {
            return this.getInCenter().x;
        },

        set: function (value)
        {
            var current = this.getInCenter();

            this.translate(value - current.x, 0);
        }

    },

    y: {

        get: function ()
        {
            return this.getInCenter().y;
        },

        set: function (value)
        {
            var current = this.getInCenter();

            this.translate(0, value - current.y);
        }

    },

    alpha: {

        get: function ()
        {
            var v1 = this.vertex1;
            var v2 = this.vertex2;
            var v3 = this.vertex3;

            return (v1.alpha + v2.alpha + v3.alpha) / 3;
        },

        set: function (value)
        {
            this.vertex1.alpha = value;
            this.vertex2.alpha = value;
            this.vertex3.alpha = value;
        }

    },

    depth: {

        get: function ()
        {
            var v1 = this.vertex1;
            var v2 = this.vertex2;
            var v3 = this.vertex3;

            return (v1.vz + v2.vz + v3.vz) / 3;
        }

    },

    destroy: function ()
    {
        this.vertex1 = null;
        this.vertex2 = null;
        this.vertex3 = null;
    }

});

module.exports = Face;
