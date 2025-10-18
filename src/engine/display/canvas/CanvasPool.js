var CONST = require('../../const');
var Smoothing = require('./Smoothing');

var pool = [];

var _disableContextSmoothing = false;

var CanvasPool = function ()
{

    var create = function (parent, width, height, canvasType, selfParent)
    {
        if (width === undefined) { width = 1; }
        if (height === undefined) { height = 1; }
        if (canvasType === undefined) { canvasType = CONST.CANVAS; }
        if (selfParent === undefined) { selfParent = false; }

        var canvas;
        var container = first(canvasType);

        if (container === null)
        {
            container = {
                parent: parent,
                canvas: document.createElement('canvas'),
                type: canvasType
            };

            if (canvasType === CONST.CANVAS)
            {
                pool.push(container);
            }

            canvas = container.canvas;
        }
        else
        {
            container.parent = parent;

            canvas = container.canvas;
        }

        if (selfParent)
        {
            container.parent = canvas;
        }

        canvas.width = width;
        canvas.height = height;

        if (_disableContextSmoothing && canvasType === CONST.CANVAS)
        {
            Smoothing.disable(canvas.getContext('2d', { willReadFrequently: false }));
        }

        return canvas;
    };

    var create2D = function (parent, width, height)
    {
        return create(parent, width, height, CONST.CANVAS);
    };

    var createWebGL = function (parent, width, height)
    {
        return create(parent, width, height, CONST.WEBGL);
    };

    var first = function (canvasType)
    {
        if (canvasType === undefined) { canvasType = CONST.CANVAS; }

        if (canvasType === CONST.WEBGL)
        {
            return null;
        }

        for (var i = 0; i < pool.length; i++)
        {
            var container = pool[i];

            if (!container.parent && container.type === canvasType)
            {
                return container;
            }
        }

        return null;
    };

    var remove = function (parent)
    {

        var isCanvas = parent instanceof HTMLCanvasElement;

        pool.forEach(function (container)
        {
            if ((isCanvas && container.canvas === parent) || (!isCanvas && container.parent === parent))
            {
                container.parent = null;
                container.canvas.width = 1;
                container.canvas.height = 1;
            }
        });
    };

    var total = function ()
    {
        var c = 0;

        pool.forEach(function (container)
        {
            if (container.parent)
            {
                c++;
            }
        });

        return c;
    };

    var free = function ()
    {
        return pool.length - total();
    };

    var disableSmoothing = function ()
    {
        _disableContextSmoothing = true;
    };

    var enableSmoothing = function ()
    {
        _disableContextSmoothing = false;
    };

    return {
        create2D: create2D,
        create: create,
        createWebGL: createWebGL,
        disableSmoothing: disableSmoothing,
        enableSmoothing: enableSmoothing,
        first: first,
        free: free,
        pool: pool,
        remove: remove,
        total: total
    };
};

module.exports = CanvasPool();
