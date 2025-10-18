var BitmapMask = require('../../display/mask/BitmapMask');
var GeometryMask = require('../../display/mask/GeometryMask');

var Mask = {

    mask: null,

    setMask: function (mask)
    {
        this.mask = mask;

        return this;
    },

    clearMask: function (destroyMask)
    {
        if (destroyMask === undefined) { destroyMask = false; }

        if (destroyMask && this.mask)
        {
            this.mask.destroy();
        }

        this.mask = null;

        return this;
    },

    createBitmapMask: function (maskObject, x, y, texture, frame)
    {
        if (maskObject === undefined && (this.texture || this.shader || this.geom))
        {

            maskObject = this;
        }

        return new BitmapMask(this.scene, maskObject, x, y, texture, frame);
    },

    createGeometryMask: function (graphics)
    {
        if (graphics === undefined && (this.type === 'Graphics' || this.geom))
        {

            graphics = this;
        }

        return new GeometryMask(this.scene, graphics);
    }

};

module.exports = Mask;
