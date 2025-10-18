var Class = require('../../../utils/Class');
var ColorMatrix = require('../../../display/ColorMatrix');
var GetFastValue = require('../../../utils/object/GetFastValue');
var ShaderSourceFS = require('../shaders/PostFX-frag');
var ShaderSourceVS = require('../shaders/Quad-vert');
var WebGLPipeline = require('../WebGLPipeline');

var PostFXPipeline = new Class({

    Extends: WebGLPipeline,

    initialize:

    function PostFXPipeline (config)
    {
        config.renderTarget = GetFastValue(config, 'renderTarget', 1);
        config.fragShader = GetFastValue(config, 'fragShader', ShaderSourceFS);
        config.vertShader = GetFastValue(config, 'vertShader', ShaderSourceVS);
        config.attributes = GetFastValue(config, 'attributes', [
            {
                name: 'inPosition',
                size: 2
            },
            {
                name: 'inTexCoord',
                size: 2
            }
        ]);
        config.batchSize = 1;
        config.vertices = [
            -1, -1, 0, 0,
            -1, 1, 0, 1,
            1, 1, 1, 1,
            -1, -1, 0, 0,
            1, 1, 1, 1,
            1, -1, 1, 0
        ];

        WebGLPipeline.call(this, config);

        this.isPostFX = true;

        this.gameObject;

        this.controller;

        this.colorMatrix = new ColorMatrix();

        this.fullFrame1;

        this.fullFrame2;

        this.halfFrame1;

        this.halfFrame2;

        if (this.renderer.isBooted)
        {
            this.manager = this.renderer.pipelines;
        }
    },

    bootFX: function ()
    {
        WebGLPipeline.prototype.boot.call(this);

        var utility = this.manager.UTILITY_PIPELINE;

        this.fullFrame1 = utility.fullFrame1;
        this.fullFrame2 = utility.fullFrame2;
        this.halfFrame1 = utility.halfFrame1;
        this.halfFrame2 = utility.halfFrame2;

        var renderer = this.renderer;

        this.set1i('uMainSampler', 0);
        this.set2f('uResolution', renderer.width, renderer.height);

        var targets = this.renderTargets;

        for (var i = 0; i < targets.length; i++)
        {
            targets[i].autoResize = true;
        }
    },

    postBatch: function (gameObject)
    {
        if (!this.hasBooted)
        {
            this.bootFX();

            if (this.currentRenderTarget)
            {
                this.currentRenderTarget.bind();
            }
        }

        this.onDraw(this.currentRenderTarget);

        this.onPostBatch(gameObject);

        return this;
    },

    onDraw: function (renderTarget)
    {
        this.bindAndDraw(renderTarget);
    },

    getController: function (controller)
    {
        if (controller !== undefined)
        {
            return controller;
        }
        else if (this.controller)
        {
            return this.controller;
        }
        else
        {
            return this;
        }
    },

    copySprite: function (source, target, reset)
    {
        if (reset === undefined) { reset = false; }

        var gl = this.gl;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source.texture.webGLTexture);

        var currentFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer.webGLFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture.webGLTexture, 0);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (reset)
        {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, currentFBO);
        }
    },

    copyFrame: function (source, target, brightness, clear, clearAlpha)
    {
        this.manager.copyFrame(source, target, brightness, clear, clearAlpha);
    },

    copyToGame: function (source)
    {
        this.manager.copyToGame(source);
    },

    drawFrame: function (source, target, clearAlpha)
    {
        this.manager.drawFrame(source, target, clearAlpha, this.colorMatrix);
    },

    blendFrames: function (source1, source2, target, strength, clearAlpha)
    {
        this.manager.blendFrames(source1, source2, target, strength, clearAlpha);
    },

    blendFramesAdditive: function (source1, source2, target, strength, clearAlpha)
    {
        this.manager.blendFramesAdditive(source1, source2, target, strength, clearAlpha);
    },

    clearFrame: function (target, clearAlpha)
    {
        this.manager.clearFrame(target, clearAlpha);
    },

    blitFrame: function (source, target, brightness, clear, clearAlpha, eraseMode)
    {
        this.manager.blitFrame(source, target, brightness, clear, clearAlpha, eraseMode);
    },

    copyFrameRect: function (source, target, x, y, width, height, clear, clearAlpha)
    {
        this.manager.copyFrameRect(source, target, x, y, width, height, clear, clearAlpha);
    },

    bindAndDraw: function (source, target, clear, clearAlpha, currentShader)
    {
        if (clear === undefined) { clear = true; }
        if (clearAlpha === undefined) { clearAlpha = true; }

        var gl = this.gl;
        var renderer = this.renderer;

        this.bind(currentShader);

        this.set1i('uMainSampler', 0);

        if (target)
        {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer.webGLFramebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture.webGLTexture, 0);

            if (clear)
            {
                if (clearAlpha)
                {
                    gl.clearColor(0, 0, 0, 0);
                }
                else
                {
                    gl.clearColor(0, 0, 0, 1);
                }

                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }
        else
        {
            renderer.popFramebuffer(false, false);

            if (!renderer.currentFramebuffer)
            {
                gl.viewport(0, 0, renderer.width, renderer.height);
            }
        }

        renderer.restoreStencilMask();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source.texture.webGLTexture);

        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (target)
        {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderer.currentFramebuffer.webGLFramebuffer);
        }
    },

    destroy: function ()
    {
        if (this.controller)
        {
            this.controller.destroy();
        }

        this.gameObject = null;
        this.controller = null;
        this.colorMatrix = null;
        this.fullFrame1 = null;
        this.fullFrame2 = null;
        this.halfFrame1 = null;
        this.halfFrame2 = null;

        this.manager.removePostPipeline(this);

        WebGLPipeline.prototype.destroy.call(this);

        return this;
    }

});

module.exports = PostFXPipeline;
