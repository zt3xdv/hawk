var Class = require('../utils/Class');
var CONST = require('./const');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var GameEvents = require('../core/events');
var Keyboard = require('./keyboard/KeyboardManager');
var Mouse = require('./mouse/MouseManager');
var Pointer = require('./Pointer');
var Touch = require('./touch/TouchManager');
var TransformMatrix = require('../gameobjects/components/TransformMatrix');
var TransformXY = require('../math/TransformXY');

var InputManager = new Class({

    initialize:

    function InputManager (game, config)
    {

        this.game = game;

        this.scaleManager;

        this.canvas;

        this.config = config;

        this.enabled = true;

        this.events = new EventEmitter();

        this.isOver = true;

        this.defaultCursor = '';

        this.keyboard = (config.inputKeyboard) ? new Keyboard(this) : null;

        this.mouse = (config.inputMouse) ? new Mouse(this) : null;

        this.touch = (config.inputTouch) ? new Touch(this) : null;

        this.pointers = [];

        this.pointersTotal = config.inputActivePointers;

        for (var i = 0; i <= this.pointersTotal; i++)
        {
            var pointer = new Pointer(this, i);

            pointer.smoothFactor = config.inputSmoothFactor;

            this.pointers.push(pointer);
        }

        this.mousePointer = (config.inputMouse) ? this.pointers[0] : null;

        this.activePointer = this.pointers[0];

        this.globalTopOnly = true;

        this.time = 0;

        this._tempPoint = { x: 0, y: 0 };

        this._tempHitTest = [];

        this._tempMatrix = new TransformMatrix();

        this._tempMatrix2 = new TransformMatrix();

        this._tempSkip = false;

        this.mousePointerContainer = [ this.mousePointer ];

        game.events.once(GameEvents.BOOT, this.boot, this);
    },

    boot: function ()
    {
        var game = this.game;
        var events = game.events;

        this.canvas = game.canvas;

        this.scaleManager = game.scale;

        this.events.emit(Events.MANAGER_BOOT);

        events.on(GameEvents.PRE_RENDER, this.preRender, this);

        events.once(GameEvents.DESTROY, this.destroy, this);
    },

    setCanvasOver: function (event)
    {
        this.isOver = true;

        this.events.emit(Events.GAME_OVER, event);
    },

    setCanvasOut: function (event)
    {
        this.isOver = false;

        this.events.emit(Events.GAME_OUT, event);
    },

    preRender: function ()
    {
        var time = this.game.loop.now;
        var delta = this.game.loop.delta;
        var scenes = this.game.scene.getScenes(true, true);

        this.time = time;

        this.events.emit(Events.MANAGER_UPDATE);

        for (var i = 0; i < scenes.length; i++)
        {
            var scene = scenes[i];

            if (scene.sys.input && scene.sys.input.updatePoll(time, delta) && this.globalTopOnly)
            {

                return;
            }
        }
    },

    setDefaultCursor: function (cursor)
    {
        this.defaultCursor = cursor;

        if (this.canvas.style.cursor !== cursor)
        {
            this.canvas.style.cursor = cursor;
        }
    },

    setCursor: function (interactiveObject)
    {
        if (interactiveObject.cursor)
        {
            this.canvas.style.cursor = interactiveObject.cursor;
        }
    },

    resetCursor: function (interactiveObject, forceReset)
    {
        if ((forceReset || (interactiveObject && interactiveObject.cursor)) && this.canvas)
        {
            this.canvas.style.cursor = this.defaultCursor;
        }
    },

    addPointer: function (quantity)
    {
        if (quantity === undefined) { quantity = 1; }

        var output = [];

        if (this.pointersTotal + quantity > 10)
        {
            quantity = 10 - this.pointersTotal;
        }

        for (var i = 0; i < quantity; i++)
        {
            var id = this.pointers.length;

            var pointer = new Pointer(this, id);

            pointer.smoothFactor = this.config.inputSmoothFactor;

            this.pointers.push(pointer);

            this.pointersTotal++;

            output.push(pointer);
        }

        return output;
    },

    updateInputPlugins: function (type, pointers)
    {
        var scenes = this.game.scene.getScenes(false, true);

        this._tempSkip = false;

        for (var i = 0; i < scenes.length; i++)
        {
            var scene = scenes[i];

            if (scene.sys.input)
            {
                var capture = scene.sys.input.update(type, pointers);

                if ((capture && this.globalTopOnly) || this._tempSkip)
                {

                    return;
                }
            }
        }
    },

    onTouchStart: function (event)
    {
        var pointers = this.pointers;
        var changed = [];

        for (var c = 0; c < event.changedTouches.length; c++)
        {
            var changedTouch = event.changedTouches[c];

            for (var i = 1; i < pointers.length; i++)
            {
                var pointer = pointers[i];

                if (!pointer.active)
                {
                    pointer.touchstart(changedTouch, event);

                    this.activePointer = pointer;

                    changed.push(pointer);

                    break;
                }
            }
        }

        this.updateInputPlugins(CONST.TOUCH_START, changed);
    },

    onTouchMove: function (event)
    {
        var pointers = this.pointers;
        var changed = [];

        for (var c = 0; c < event.changedTouches.length; c++)
        {
            var changedTouch = event.changedTouches[c];

            for (var i = 1; i < pointers.length; i++)
            {
                var pointer = pointers[i];

                if (pointer.active && pointer.identifier === changedTouch.identifier)
                {
                    var element = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
                    var overCanvas = element === this.canvas;

                    if (!this.isOver && overCanvas)
                    {
                        this.setCanvasOver(event);
                    }
                    else if (this.isOver && !overCanvas)
                    {
                        this.setCanvasOut(event);
                    }

                    if (this.isOver)
                    {
                        pointer.touchmove(changedTouch, event);

                        this.activePointer = pointer;

                        changed.push(pointer);
                    }

                    break;
                }
            }
        }

        this.updateInputPlugins(CONST.TOUCH_MOVE, changed);
    },

    onTouchEnd: function (event)
    {
        var pointers = this.pointers;
        var changed = [];

        for (var c = 0; c < event.changedTouches.length; c++)
        {
            var changedTouch = event.changedTouches[c];

            for (var i = 1; i < pointers.length; i++)
            {
                var pointer = pointers[i];

                if (pointer.active && pointer.identifier === changedTouch.identifier)
                {
                    pointer.touchend(changedTouch, event);

                    changed.push(pointer);

                    break;
                }
            }
        }

        this.updateInputPlugins(CONST.TOUCH_END, changed);
    },

    onTouchCancel: function (event)
    {
        var pointers = this.pointers;
        var changed = [];

        for (var c = 0; c < event.changedTouches.length; c++)
        {
            var changedTouch = event.changedTouches[c];

            for (var i = 1; i < pointers.length; i++)
            {
                var pointer = pointers[i];

                if (pointer.active && pointer.identifier === changedTouch.identifier)
                {
                    pointer.touchcancel(changedTouch, event);

                    changed.push(pointer);

                    break;
                }
            }
        }

        this.updateInputPlugins(CONST.TOUCH_CANCEL, changed);
    },

    onMouseDown: function (event)
    {
        var mousePointer = this.mousePointer;

        mousePointer.down(event);

        mousePointer.updateMotion();

        this.activePointer = mousePointer;

        this.updateInputPlugins(CONST.MOUSE_DOWN, this.mousePointerContainer);
    },

    onMouseMove: function (event)
    {
        var mousePointer = this.mousePointer;

        mousePointer.move(event);

        mousePointer.updateMotion();

        this.activePointer = mousePointer;

        this.updateInputPlugins(CONST.MOUSE_MOVE, this.mousePointerContainer);
    },

    onMouseUp: function (event)
    {
        var mousePointer = this.mousePointer;

        mousePointer.up(event);

        mousePointer.updateMotion();

        this.activePointer = mousePointer;

        this.updateInputPlugins(CONST.MOUSE_UP, this.mousePointerContainer);
    },

    onMouseWheel: function (event)
    {
        var mousePointer = this.mousePointer;

        mousePointer.wheel(event);

        this.activePointer = mousePointer;

        this.updateInputPlugins(CONST.MOUSE_WHEEL, this.mousePointerContainer);
    },

    onPointerLockChange: function (event)
    {
        var isLocked = this.mouse.locked;

        this.mousePointer.locked = isLocked;

        this.events.emit(Events.POINTERLOCK_CHANGE, event, isLocked);
    },

    inputCandidate: function (gameObject, camera)
    {
        var input = gameObject.input;

        if (!input || !input.enabled || !gameObject.willRender(camera))
        {
            return false;
        }

        var visible = true;
        var parent = gameObject.parentContainer;

        if (parent)
        {
            do
            {
                if (!parent.willRender(camera))
                {
                    visible = false;
                    break;
                }

                parent = parent.parentContainer;

            } while (parent);
        }

        return visible;
    },

    hitTest: function (pointer, gameObjects, camera, output)
    {
        if (output === undefined) { output = this._tempHitTest; }

        var tempPoint = this._tempPoint;

        var csx = camera.scrollX;
        var csy = camera.scrollY;

        output.length = 0;

        var x = pointer.x;
        var y = pointer.y;

        camera.getWorldPoint(x, y, tempPoint);

        pointer.worldX = tempPoint.x;
        pointer.worldY = tempPoint.y;

        var point = { x: 0, y: 0 };

        var matrix = this._tempMatrix;
        var parentMatrix = this._tempMatrix2;

        for (var i = 0; i < gameObjects.length; i++)
        {
            var gameObject = gameObjects[i];

            if (!this.inputCandidate(gameObject, camera))
            {
                continue;
            }

            var px = tempPoint.x + (csx * gameObject.scrollFactorX) - csx;
            var py = tempPoint.y + (csy * gameObject.scrollFactorY) - csy;

            if (gameObject.parentContainer)
            {
                gameObject.getWorldTransformMatrix(matrix, parentMatrix);

                matrix.applyInverse(px, py, point);
            }
            else
            {
                TransformXY(px, py, gameObject.x, gameObject.y, gameObject.rotation, gameObject.scaleX, gameObject.scaleY, point);
            }

            if (this.pointWithinHitArea(gameObject, point.x, point.y))
            {
                output.push(gameObject);
            }
        }

        return output;
    },

    pointWithinHitArea: function (gameObject, x, y)
    {

        x += gameObject.displayOriginX;
        y += gameObject.displayOriginY;

        var input = gameObject.input;

        if (input && input.hitAreaCallback(input.hitArea, x, y, gameObject))
        {
            input.localX = x;
            input.localY = y;

            return true;
        }
        else
        {
            return false;
        }
    },

    pointWithinInteractiveObject: function (object, x, y)
    {
        if (!object.hitArea)
        {
            return false;
        }

        x += object.gameObject.displayOriginX;
        y += object.gameObject.displayOriginY;

        object.localX = x;
        object.localY = y;

        return object.hitAreaCallback(object.hitArea, x, y, object);
    },

    transformPointer: function (pointer, pageX, pageY, wasMove)
    {
        var p0 = pointer.position;
        var p1 = pointer.prevPosition;

        p1.x = p0.x;
        p1.y = p0.y;

        var x = this.scaleManager.transformX(pageX);
        var y = this.scaleManager.transformY(pageY);

        var a = pointer.smoothFactor;

        if (!wasMove || a === 0)
        {

            p0.x = x;
            p0.y = y;
        }
        else
        {

            p0.x = x * a + p1.x * (1 - a);
            p0.y = y * a + p1.y * (1 - a);
        }
    },

    destroy: function ()
    {
        this.events.removeAllListeners();

        this.game.events.off(GameEvents.PRE_RENDER);

        if (this.keyboard)
        {
            this.keyboard.destroy();
        }

        if (this.mouse)
        {
            this.mouse.destroy();
        }

        if (this.touch)
        {
            this.touch.destroy();
        }

        for (var i = 0; i < this.pointers.length; i++)
        {
            this.pointers[i].destroy();
        }

        this.pointers = [];
        this._tempHitTest = [];
        this._tempMatrix.destroy();
        this.canvas = null;
        this.game = null;
    }

});

module.exports = InputManager;
