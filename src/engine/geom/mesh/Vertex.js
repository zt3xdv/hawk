var Class = require('../../utils/Class');
var Utils = require('../../renderer/webgl/Utils');
var Vector3 = require('../../math/Vector3');

var Vertex = new Class({

    Extends: Vector3,

    initialize:

    function Vertex (x, y, z, u, v, color, alpha, nx, ny, nz)
    {
        if (color === undefined) { color = 0xffffff; }
        if (alpha === undefined) { alpha = 1; }
        if (nx === undefined) { nx = 0; }
        if (ny === undefined) { ny = 0; }
        if (nz === undefined) { nz = 0; }

        Vector3.call(this, x, y, z);

        this.vx = 0;

        this.vy = 0;

        this.vz = 0;

        this.nx = nx;

        this.ny = ny;

        this.nz = nz;

        this.u = u;

        this.v = v;

        this.color = color;

        this.alpha = alpha;

        this.tx = 0;

        this.ty = 0;

        this.ta = 0;

        this.tu = u;

        this.tv = v;
    },

    setUVs: function (u, v)
    {
        this.u = u;
        this.v = v;

        this.tu = u;
        this.tv = v;

        return this;
    },

    scrollUV: function (x, y)
    {
        this.tu += x;
        this.tv += y;

        return this;
    },

    scaleUV: function (x, y)
    {
        this.tu = this.u * x;
        this.tv = this.v * y;

        return this;
    },

    transformCoordinatesLocal: function (transformMatrix, width, height, cameraZ)
    {
        var x = this.x;
        var y = this.y;
        var z = this.z;

        var m = transformMatrix.val;

        var tx = (x * m[0]) + (y * m[4]) + (z * m[8]) + m[12];
        var ty = (x * m[1]) + (y * m[5]) + (z * m[9]) + m[13];
        var tz = (x * m[2]) + (y * m[6]) + (z * m[10]) + m[14];
        var tw = (x * m[3]) + (y * m[7]) + (z * m[11]) + m[15];

        this.vx = (tx / tw) * width;
        this.vy = -(ty / tw) * height;

        if (cameraZ <= 0)
        {
            this.vz = (tz / tw);
        }
        else
        {
            this.vz = -(tz / tw);
        }
    },

    resize: function (x, y, width, height, originX, originY)
    {
        this.x = x;
        this.y = y;

        this.vx = this.x * width;
        this.vy = -this.y * height;
        this.vz = 0;

        if (originX < 0.5)
        {
            this.vx += width * (0.5 - originX);
        }
        else if (originX > 0.5)
        {
            this.vx -= width * (originX - 0.5);
        }

        if (originY < 0.5)
        {
            this.vy += height * (0.5 - originY);
        }
        else if (originY > 0.5)
        {
            this.vy -= height * (originY - 0.5);
        }

        return this;
    },

    update: function (a, b, c, d, e, f, roundPixels, alpha)
    {
        var tx = this.vx * a + this.vy * c + e;
        var ty = this.vx * b + this.vy * d + f;

        if (roundPixels)
        {
            tx = Math.round(tx);
            ty = Math.round(ty);
        }

        this.tx = tx;
        this.ty = ty;
        this.ta = this.alpha * alpha;

        return this;
    },

    load: function (F32, U32, offset, textureUnit, tintEffect)
    {
        F32[++offset] = this.tx;
        F32[++offset] = this.ty;
        F32[++offset] = this.tu;
        F32[++offset] = this.tv;
        F32[++offset] = textureUnit;
        F32[++offset] = tintEffect;
        U32[++offset] = Utils.getTintAppendFloatAlpha(this.color, this.ta);

        return offset;
    }

});

module.exports = Vertex;
