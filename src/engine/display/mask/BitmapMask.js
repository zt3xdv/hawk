var Class = require('../../utils/Class');
var GameObjectFactory = require('../../gameobjects/GameObjectFactory');

var BitmapMask = new Class({

    initialize:

    function BitmapMask (scene, maskObject, x, y, texture, frame)
    {
        if (!maskObject)
        {
            maskObject = scene.sys.make.image({ x: x, y: y, key: texture, frame: frame, add: false });
        }

        this.bitmapMask = maskObject;

        this.invertAlpha = false;

        this.isStencil = false;
    },

    setBitmap: function (maskObject)
    {
        this.bitmapMask = maskObject;
    },

    preRenderWebGL: function (renderer, maskedObject, camera)
    {
        renderer.pipelines.BITMAPMASK_PIPELINE.beginMask(this, maskedObject, camera);
    },

    postRenderWebGL: function (renderer, camera, renderTarget)
    {
        renderer.pipelines.BITMAPMASK_PIPELINE.endMask(this, camera, renderTarget);
    },

    preRenderCanvas: function ()
    {

    },

    postRenderCanvas: function ()
    {

    },

    destroy: function ()
    {
        this.bitmapMask = null;
    }

});

GameObjectFactory.register('bitmapMask', function (maskObject, x, y, key, frame)
{
    return new BitmapMask(this.scene, maskObject, x, y, key, frame);
});

module.exports = BitmapMask;
