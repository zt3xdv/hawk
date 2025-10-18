var CanvasInterpolation = require('../display/canvas/CanvasInterpolation');
var CanvasPool = require('../display/canvas/CanvasPool');
var CONST = require('../const');
var Features = require('../device/Features');

var CreateRenderer = function (game)
{
    var config = game.config;

    if ((config.customEnvironment || config.canvas) && config.renderType === CONST.AUTO)
    {
        throw new Error('Must set explicit renderType in custom environment');
    }

    if (!config.customEnvironment && !config.canvas && config.renderType !== CONST.HEADLESS)
    {
        if (config.renderType === CONST.AUTO)
        {
            config.renderType = Features.webGL ? CONST.WEBGL : CONST.CANVAS;
        }

        if (config.renderType === CONST.WEBGL)
        {
            if (!Features.webGL) { throw new Error('Cannot create WebGL context, aborting.'); }
        }
        else if (config.renderType === CONST.CANVAS)
        {
            if (!Features.canvas) { throw new Error('Cannot create Canvas context, aborting.'); }
        }
        else
        {
            throw new Error('Unknown value for renderer type: ' + config.renderType);
        }
    }

    if (!config.antialias)
    {
        CanvasPool.disableSmoothing();
    }

    var baseSize = game.scale.baseSize;

    var width = baseSize.width;
    var height = baseSize.height;

    if (config.canvas)
    {
        game.canvas = config.canvas;

        game.canvas.width = width;
        game.canvas.height = height;
    }
    else
    {
        game.canvas = CanvasPool.create(game, width, height, config.renderType);
    }

    if (config.canvasStyle)
    {
        game.canvas.style = config.canvasStyle;
    }

    if (!config.antialias)
    {
        CanvasInterpolation.setCrisp(game.canvas);
    }

    if (config.renderType === CONST.HEADLESS)
    {

        return;
    }

    var CanvasRenderer;
    var WebGLRenderer;

    if (typeof WEBGL_RENDERER && typeof CANVAS_RENDERER)
    {
        CanvasRenderer = require('../renderer/canvas/CanvasRenderer');
        WebGLRenderer = require('../renderer/webgl/WebGLRenderer');

        if (config.renderType === CONST.WEBGL)
        {
            game.renderer = new WebGLRenderer(game);
        }
        else
        {
            game.renderer = new CanvasRenderer(game);
            game.context = game.renderer.gameContext;
        }
    }

    if (typeof WEBGL_RENDERER && !typeof CANVAS_RENDERER)
    {
        WebGLRenderer = require('../renderer/webgl/WebGLRenderer');

        config.renderType = CONST.WEBGL;

        game.renderer = new WebGLRenderer(game);
    }

    if (!typeof WEBGL_RENDERER && typeof CANVAS_RENDERER)
    {
        CanvasRenderer = require('../renderer/canvas/CanvasRenderer');

        config.renderType = CONST.CANVAS;

        game.renderer = new CanvasRenderer(game);

        game.context = game.renderer.gameContext;
    }
};

module.exports = CreateRenderer;
