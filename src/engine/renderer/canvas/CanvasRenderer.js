var CameraEvents = require('../../cameras/2d/events');
var CanvasSnapshot = require('../snapshot/CanvasSnapshot');
var Class = require('../../utils/Class');
var CONST = require('../../const');
var EventEmitter = require('eventemitter3');
var Events = require('../events');
var GetBlendModes = require('./utils/GetBlendModes');
var ScaleEvents = require('../../scale/events');
var TextureEvents = require('../../textures/events');
var GameEvents = require('../../core/events');
var TransformMatrix = require('../../gameobjects/components/TransformMatrix');

var CanvasRenderer = new Class({

    Extends: EventEmitter,

    initialize:

    function CanvasRenderer (game)
    {
        EventEmitter.call(this);

        var gameConfig = game.config;

        this.config = {
            clearBeforeRender: gameConfig.clearBeforeRender,
            backgroundColor: gameConfig.backgroundColor,
            antialias: gameConfig.antialias,
            roundPixels: gameConfig.roundPixels,
            transparent: gameConfig.transparent
        };

        this.game = game;

        this.type = CONST.CANVAS;

        this.drawCount = 0;

        this.width = 0;

        this.height = 0;

        this.gameCanvas = game.canvas;

        var contextOptions = {
            alpha: gameConfig.transparent,
            desynchronized: gameConfig.desynchronized,
            willReadFrequently: false
        };

        this.gameContext = (gameConfig.context) ? gameConfig.context : this.gameCanvas.getContext('2d', contextOptions);

        this.currentContext = this.gameContext;

        this.antialias = gameConfig.antialias;

        this.blendModes = GetBlendModes();

        this.snapshotState = {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            getPixel: false,
            callback: null,
            type: 'image/png',
            encoder: 0.92
        };

        this._tempMatrix1 = new TransformMatrix();

        this._tempMatrix2 = new TransformMatrix();

        this._tempMatrix3 = new TransformMatrix();

        this.isBooted = false;

        this.init();
    },

    init: function ()
    {
        var game = this.game;

        game.events.once(GameEvents.BOOT, function ()
        {
            var config = this.config;

            if (!config.transparent)
            {
                var ctx = this.gameContext;
                var gameCanvas = this.gameCanvas;

                ctx.fillStyle = config.backgroundColor.rgba;
                ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            }

        }, this);

        game.textures.once(TextureEvents.READY, this.boot, this);
    },

    boot: function ()
    {
        var game = this.game;

        var baseSize = game.scale.baseSize;

        this.width = baseSize.width;
        this.height = baseSize.height;

        this.isBooted = true;

        game.scale.on(ScaleEvents.RESIZE, this.onResize, this);

        this.resize(baseSize.width, baseSize.height);
    },

    onResize: function (gameSize, baseSize)
    {

        if (baseSize.width !== this.width || baseSize.height !== this.height)
        {
            this.resize(baseSize.width, baseSize.height);
        }
    },

    resize: function (width, height)
    {
        this.width = width;
        this.height = height;

        this.emit(Events.RESIZE, width, height);
    },

    resetTransform: function ()
    {
        this.currentContext.setTransform(1, 0, 0, 1, 0, 0);
    },

    setBlendMode: function (blendMode)
    {
        this.currentContext.globalCompositeOperation = blendMode;

        return this;
    },

    setContext: function (ctx)
    {
        this.currentContext = (ctx) ? ctx : this.gameContext;

        return this;
    },

    setAlpha: function (alpha)
    {
        this.currentContext.globalAlpha = alpha;

        return this;
    },

    preRender: function ()
    {
        var ctx = this.gameContext;
        var config = this.config;

        var width = this.width;
        var height = this.height;

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.emit(Events.PRE_RENDER_CLEAR);

        if (config.clearBeforeRender)
        {
            ctx.clearRect(0, 0, width, height);

            if (!config.transparent)
            {
                ctx.fillStyle = config.backgroundColor.rgba;
                ctx.fillRect(0, 0, width, height);
            }
        }

        ctx.save();

        this.drawCount = 0;

        this.emit(Events.PRE_RENDER);
    },

    render: function (scene, children, camera)
    {
        var childCount = children.length;

        this.emit(Events.RENDER, scene, camera);

        var cx = camera.x;
        var cy = camera.y;
        var cw = camera.width;
        var ch = camera.height;

        var ctx = (camera.renderToTexture) ? camera.context : scene.sys.context;

        ctx.save();

        if (this.game.scene.customViewports)
        {
            ctx.beginPath();
            ctx.rect(cx, cy, cw, ch);
            ctx.clip();
        }

        camera.emit(CameraEvents.PRE_RENDER, camera);

        this.currentContext = ctx;

        var mask = camera.mask;

        if (mask)
        {
            mask.preRenderCanvas(this, null, camera._maskCamera);
        }

        if (!camera.transparent)
        {
            ctx.fillStyle = camera.backgroundColor.rgba;
            ctx.fillRect(cx, cy, cw, ch);
        }

        ctx.globalAlpha = camera.alpha;

        ctx.globalCompositeOperation = 'source-over';

        this.drawCount += childCount;

        if (camera.renderToTexture)
        {
            camera.emit(CameraEvents.PRE_RENDER, camera);
        }

        camera.matrix.copyToContext(ctx);

        for (var i = 0; i < childCount; i++)
        {
            var child = children[i];

            if (child.mask)
            {
                child.mask.preRenderCanvas(this, child, camera);
            }

            child.renderCanvas(this, child, camera);

            if (child.mask)
            {
                child.mask.postRenderCanvas(this, child, camera);
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        camera.flashEffect.postRenderCanvas(ctx);
        camera.fadeEffect.postRenderCanvas(ctx);

        camera.dirty = false;

        if (mask)
        {
            mask.postRenderCanvas(this);
        }

        ctx.restore();

        if (camera.renderToTexture)
        {
            camera.emit(CameraEvents.POST_RENDER, camera);

            if (camera.renderToGame)
            {
                scene.sys.context.drawImage(camera.canvas, cx, cy);
            }
        }

        camera.emit(CameraEvents.POST_RENDER, camera);
    },

    postRender: function ()
    {
        var ctx = this.gameContext;

        ctx.restore();

        this.emit(Events.POST_RENDER);

        var state = this.snapshotState;

        if (state.callback)
        {
            CanvasSnapshot(this.gameCanvas, state);

            state.callback = null;
        }
    },

    snapshotCanvas: function (canvas, callback, getPixel, x, y, width, height, type, encoderOptions)
    {
        if (getPixel === undefined) { getPixel = false; }

        this.snapshotArea(x, y, width, height, callback, type, encoderOptions);

        var state = this.snapshotState;

        state.getPixel = getPixel;

        CanvasSnapshot(canvas, state);

        state.callback = null;

        return this;
    },

    snapshot: function (callback, type, encoderOptions)
    {
        return this.snapshotArea(0, 0, this.gameCanvas.width, this.gameCanvas.height, callback, type, encoderOptions);
    },

    snapshotArea: function (x, y, width, height, callback, type, encoderOptions)
    {
        var state = this.snapshotState;

        state.callback = callback;
        state.type = type;
        state.encoder = encoderOptions;
        state.getPixel = false;
        state.x = x;
        state.y = y;
        state.width = Math.min(width, this.gameCanvas.width);
        state.height = Math.min(height, this.gameCanvas.height);

        return this;
    },

    snapshotPixel: function (x, y, callback)
    {
        this.snapshotArea(x, y, 1, 1, callback);

        this.snapshotState.getPixel = true;

        return this;
    },

    batchSprite: function (sprite, frame, camera, parentTransformMatrix)
    {
        var alpha = camera.alpha * sprite.alpha;

        if (alpha === 0)
        {

            return;
        }

        var ctx = this.currentContext;

        var camMatrix = this._tempMatrix1;
        var spriteMatrix = this._tempMatrix2;

        var cd = frame.canvasData;

        var frameX = cd.x;
        var frameY = cd.y;
        var frameWidth = frame.cutWidth;
        var frameHeight = frame.cutHeight;
        var customPivot = frame.customPivot;

        var res = frame.source.resolution;

        var displayOriginX = sprite.displayOriginX;
        var displayOriginY = sprite.displayOriginY;

        var x = -displayOriginX + frame.x;
        var y = -displayOriginY + frame.y;

        if (sprite.isCropped)
        {
            var crop = sprite._crop;

            if (crop.flipX !== sprite.flipX || crop.flipY !== sprite.flipY)
            {
                frame.updateCropUVs(crop, sprite.flipX, sprite.flipY);
            }

            frameWidth = crop.cw;
            frameHeight = crop.ch;

            frameX = crop.cx;
            frameY = crop.cy;

            x = -displayOriginX + crop.x;
            y = -displayOriginY + crop.y;

            if (sprite.flipX)
            {
                if (x >= 0)
                {
                    x = -(x + frameWidth);
                }
                else if (x < 0)
                {
                    x = (Math.abs(x) - frameWidth);
                }
            }

            if (sprite.flipY)
            {
                if (y >= 0)
                {
                    y = -(y + frameHeight);
                }
                else if (y < 0)
                {
                    y = (Math.abs(y) - frameHeight);
                }
            }
        }

        var flipX = 1;
        var flipY = 1;

        if (sprite.flipX)
        {
            if (!customPivot)
            {
                x += (-frame.realWidth + (displayOriginX * 2));
            }

            flipX = -1;
        }

        if (sprite.flipY)
        {
            if (!customPivot)
            {
                y += (-frame.realHeight + (displayOriginY * 2));
            }

            flipY = -1;
        }

        var gx = sprite.x;
        var gy = sprite.y;

        if (camera.roundPixels)
        {
            gx = Math.floor(gx);
            gy = Math.floor(gy);
        }

        spriteMatrix.applyITRS(gx, gy, sprite.rotation, sprite.scaleX * flipX, sprite.scaleY * flipY);

        camMatrix.copyFrom(camera.matrix);

        if (parentTransformMatrix)
        {

            camMatrix.multiplyWithOffset(parentTransformMatrix, -camera.scrollX * sprite.scrollFactorX, -camera.scrollY * sprite.scrollFactorY);

            spriteMatrix.e = gx;
            spriteMatrix.f = gy;
        }
        else
        {
            spriteMatrix.e -= camera.scrollX * sprite.scrollFactorX;
            spriteMatrix.f -= camera.scrollY * sprite.scrollFactorY;
        }

        camMatrix.multiply(spriteMatrix);

        if (camera.renderRoundPixels)
        {
            camMatrix.e = Math.floor(camMatrix.e + 0.5);
            camMatrix.f = Math.floor(camMatrix.f + 0.5);
        }

        ctx.save();

        camMatrix.setToContext(ctx);

        ctx.globalCompositeOperation = this.blendModes[sprite.blendMode];

        ctx.globalAlpha = alpha;

        ctx.imageSmoothingEnabled = !frame.source.scaleMode;

        if (sprite.mask)
        {
            sprite.mask.preRenderCanvas(this, sprite, camera);
        }

        if (frameWidth > 0 && frameHeight > 0)
        {
            var fw = frameWidth / res;
            var fh = frameHeight / res;

            if (camera.roundPixels)
            {
                x = Math.floor(x + 0.5);
                y = Math.floor(y + 0.5);
                fw += 0.5;
                fh += 0.5;
            }

            ctx.drawImage(
                frame.source.image,
                frameX, frameY,
                frameWidth, frameHeight,
                x, y,
                fw, fh
            );
        }

        if (sprite.mask)
        {
            sprite.mask.postRenderCanvas(this, sprite, camera);
        }

        ctx.restore();
    },

    destroy: function ()
    {
        this.removeAllListeners();

        this.game = null;
        this.gameCanvas = null;
        this.gameContext = null;
    }

});

module.exports = CanvasRenderer;
