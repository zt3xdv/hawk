var Class = require('../../../utils/Class');
var GetFastValue = require('../../../utils/object/GetFastValue');
var ShaderSourceFS = require('../shaders/BitmapMask-frag');
var ShaderSourceVS = require('../shaders/BitmapMask-vert');
var WEBGL_CONST = require('../const');
var WebGLPipeline = require('../WebGLPipeline');

var BitmapMaskPipeline = new Class({

    Extends: WebGLPipeline,

    initialize:

    function BitmapMaskPipeline (config)
    {
        config.fragShader = GetFastValue(config, 'fragShader', ShaderSourceFS),
        config.vertShader = GetFastValue(config, 'vertShader', ShaderSourceVS),
        config.batchSize = GetFastValue(config, 'batchSize', 1),
        config.vertices = GetFastValue(config, 'vertices', [ -1, 1, -1, -7, 7, 1 ]),
        config.attributes = GetFastValue(config, 'attributes', [
            {
                name: 'inPosition',
                size: 2,
                type: WEBGL_CONST.FLOAT
            }
        ]);

        WebGLPipeline.call(this, config);
    },

    boot: function ()
    {
        WebGLPipeline.prototype.boot.call(this);

        this.set1i('uMainSampler', 0);
        this.set1i('uMaskSampler', 1);
    },

    resize: function (width, height)
    {
        WebGLPipeline.prototype.resize.call(this, width, height);

        this.set2f('uResolution', width, height);
    },

    beginMask: function (mask, maskedObject, camera)
    {
        this.renderer.beginBitmapMask(mask, camera);
    },

    endMask: function (mask, camera, renderTarget)
    {
        var gl = this.gl;
        var renderer = this.renderer;

        var bitmapMask = mask.bitmapMask;

        if (bitmapMask && gl)
        {
            renderer.drawBitmapMask(bitmapMask, camera, this);

            if (renderTarget)
            {
                this.set2f('uResolution', renderTarget.width, renderTarget.height);
            }

            this.set1i('uInvertMaskAlpha', mask.invertAlpha);

            gl.drawArrays(this.topology, 0, 3);

            if (renderTarget)
            {
                this.set2f('uResolution', this.width, this.height);
            }

            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }

});

module.exports = BitmapMaskPipeline;
