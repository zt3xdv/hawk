var Class = require('../../../utils/Class');
var GetFastValue = require('../../../utils/object/GetFastValue');
var PointLightShaderSourceFS = require('../shaders/PointLight-frag');
var PointLightShaderSourceVS = require('../shaders/PointLight-vert');
var WebGLPipeline = require('../WebGLPipeline');

var PointLightPipeline = new Class({

    Extends: WebGLPipeline,

    initialize:

    function PointLightPipeline (config)
    {
        config.vertShader = GetFastValue(config, 'vertShader', PointLightShaderSourceVS);
        config.fragShader = GetFastValue(config, 'fragShader', PointLightShaderSourceFS);
        config.attributes = GetFastValue(config, 'attributes', [
            {
                name: 'inPosition',
                size: 2
            },
            {
                name: 'inLightPosition',
                size: 2
            },
            {
                name: 'inLightRadius'
            },
            {
                name: 'inLightAttenuation'
            },
            {
                name: 'inLightColor',
                size: 4
            }
        ]);

        WebGLPipeline.call(this, config);
    },

    onRender: function (scene, camera)
    {
        this.set2f('uResolution', this.width, this.height);
        this.set1f('uCameraZoom', camera.zoom);
    },

    batchPointLight: function (light, camera, x0, y0, x1, y1, x2, y2, x3, y3, lightX, lightY)
    {
        var color = light.color;
        var intensity = light.intensity;
        var radius = light.radius;
        var attenuation = light.attenuation;

        var r = color.r * intensity;
        var g = color.g * intensity;
        var b = color.b * intensity;
        var a = camera.alpha * light.alpha;

        if (this.shouldFlush(6))
        {
            this.flush();
        }

        if (!this.currentBatch)
        {
            this.setTexture2D();
        }

        this.batchLightVert(x0, y0, lightX, lightY, radius, attenuation, r, g, b, a);
        this.batchLightVert(x1, y1, lightX, lightY, radius, attenuation, r, g, b, a);
        this.batchLightVert(x2, y2, lightX, lightY, radius, attenuation, r, g, b, a);
        this.batchLightVert(x0, y0, lightX, lightY, radius, attenuation, r, g, b, a);
        this.batchLightVert(x2, y2, lightX, lightY, radius, attenuation, r, g, b, a);
        this.batchLightVert(x3, y3, lightX, lightY, radius, attenuation, r, g, b, a);

        this.currentBatch.count = (this.vertexCount - this.currentBatch.start);
    },

    batchLightVert: function (x, y, lightX, lightY, radius, attenuation, r, g, b, a)
    {
        var vertexViewF32 = this.vertexViewF32;

        var vertexOffset = (this.vertexCount * this.currentShader.vertexComponentCount) - 1;

        vertexViewF32[++vertexOffset] = x;
        vertexViewF32[++vertexOffset] = y;
        vertexViewF32[++vertexOffset] = lightX;
        vertexViewF32[++vertexOffset] = lightY;
        vertexViewF32[++vertexOffset] = radius;
        vertexViewF32[++vertexOffset] = attenuation;
        vertexViewF32[++vertexOffset] = r;
        vertexViewF32[++vertexOffset] = g;
        vertexViewF32[++vertexOffset] = b;
        vertexViewF32[++vertexOffset] = a;

        this.vertexCount++;
    }

});

module.exports = PointLightPipeline;
