var Circle = require('../geom/circle/Circle');
var CircleContains = require('../geom/circle/Contains');
var Class = require('../utils/Class');
var CONST = require('./const');
var CreateInteractiveObject = require('./CreateInteractiveObject');
var CreatePixelPerfectHandler = require('./CreatePixelPerfectHandler');
var DistanceBetween = require('../math/distance/DistanceBetween');
var Ellipse = require('../geom/ellipse/Ellipse');
var EllipseContains = require('../geom/ellipse/Contains');
var Events = require('./events');
var EventEmitter = require('eventemitter3');
var GetFastValue = require('../utils/object/GetFastValue');
var GEOM_CONST = require('../geom/const');
var InputPluginCache = require('./InputPluginCache');
var IsPlainObject = require('../utils/object/IsPlainObject');
var PluginCache = require('../plugins/PluginCache');
var Rectangle = require('../geom/rectangle/Rectangle');
var RectangleContains = require('../geom/rectangle/Contains');
var SceneEvents = require('../scene/events');
var Triangle = require('../geom/triangle/Triangle');
var TriangleContains = require('../geom/triangle/Contains');

var InputPlugin = new Class({

    Extends: EventEmitter,

    initialize:

    function InputPlugin (scene)
    {
        EventEmitter.call(this);

        this.scene = scene;

        this.systems = scene.sys;

        this.settings = scene.sys.settings;

        this.manager = scene.sys.game.input;

        this.pluginEvents = new EventEmitter();

        this.enabled = true;

        this.displayList;

        this.cameras;

        InputPluginCache.install(this);

        this.mouse = this.manager.mouse;

        this.topOnly = true;

        this.pollRate = -1;

        this._pollTimer = 0;

        var _eventData = { cancelled: false };

        this._eventContainer = {
            stopPropagation: function ()
            {
                _eventData.cancelled = true;
            }
        };

        this._eventData = _eventData;

        this.dragDistanceThreshold = 0;

        this.dragTimeThreshold = 0;

        this._temp = [];

        this._tempZones = [];

        this._list = [];

        this._pendingInsertion = [];

        this._pendingRemoval = [];

        this._draggable = [];

        this._drag = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };

        this._dragState = [];

        this._over = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };

        this._validTypes = [ 'onDown', 'onUp', 'onOver', 'onOut', 'onMove', 'onDragStart', 'onDrag', 'onDragEnd', 'onDragEnter', 'onDragLeave', 'onDragOver', 'onDrop' ];

        this._updatedThisFrame = false;

        scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
        scene.sys.events.on(SceneEvents.START, this.start, this);
    },

    boot: function ()
    {
        this.cameras = this.systems.cameras;

        this.displayList = this.systems.displayList;

        this.systems.events.once(SceneEvents.DESTROY, this.destroy, this);

        this.pluginEvents.emit(Events.BOOT);
    },

    start: function ()
    {
        var eventEmitter = this.systems.events;

        eventEmitter.on(SceneEvents.TRANSITION_START, this.transitionIn, this);
        eventEmitter.on(SceneEvents.TRANSITION_OUT, this.transitionOut, this);
        eventEmitter.on(SceneEvents.TRANSITION_COMPLETE, this.transitionComplete, this);
        eventEmitter.on(SceneEvents.PRE_UPDATE, this.preUpdate, this);
        eventEmitter.once(SceneEvents.SHUTDOWN, this.shutdown, this);

        this.manager.events.on(Events.GAME_OUT, this.onGameOut, this);
        this.manager.events.on(Events.GAME_OVER, this.onGameOver, this);

        this.enabled = true;

        this._dragState = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

        this.pluginEvents.emit(Events.START);
    },

    onGameOver: function (event)
    {
        if (this.isActive())
        {
            this.emit(Events.GAME_OVER, event.timeStamp, event);
        }
    },

    onGameOut: function (event)
    {
        if (this.isActive())
        {
            this.emit(Events.GAME_OUT, event.timeStamp, event);
        }
    },

    preUpdate: function ()
    {

        this.pluginEvents.emit(Events.PRE_UPDATE);

        var removeList = this._pendingRemoval;
        var insertList = this._pendingInsertion;

        var toRemove = removeList.length;
        var toInsert = insertList.length;

        if (toRemove === 0 && toInsert === 0)
        {

            return;
        }

        var current = this._list;

        for (var i = 0; i < toRemove; i++)
        {
            var gameObject = removeList[i];

            var index = current.indexOf(gameObject);

            if (index > -1)
            {
                current.splice(index, 1);

                this.clear(gameObject, true);
            }
        }

        this._pendingRemoval.length = 0;

        this._list = current.concat(insertList.splice(0));
    },

    isActive: function ()
    {
        return (this.manager && this.manager.enabled && this.enabled && this.scene.sys.canInput());
    },

    setCursor: function (interactiveObject)
    {
        if (this.manager)
        {
            this.manager.setCursor(interactiveObject);
        }
    },

    resetCursor: function ()
    {
        if (this.manager)
        {
            this.manager.resetCursor(null, true);
        }
    },

    updatePoll: function (time, delta)
    {
        if (!this.isActive())
        {
            return false;
        }

        this.pluginEvents.emit(Events.UPDATE, time, delta);

        if (this._updatedThisFrame)
        {
            this._updatedThisFrame = false;

            return false;
        }

        var i;
        var manager = this.manager;

        var pointers = manager.pointers;

        for (i = 0; i < pointers.length; i++)
        {
            pointers[i].updateMotion();
        }

        if (this._list.length === 0)
        {
            return false;
        }

        var rate = this.pollRate;

        if (rate === -1)
        {
            return false;
        }
        else if (rate > 0)
        {
            this._pollTimer -= delta;

            if (this._pollTimer < 0)
            {

                this._pollTimer = this.pollRate;
            }
            else
            {

                return false;
            }
        }

        var captured = false;

        for (i = 0; i < pointers.length; i++)
        {
            var total = 0;

            var pointer = pointers[i];

            this._tempZones = [];

            this._temp = this.hitTestPointer(pointer);

            this.sortGameObjects(this._temp, pointer);
            this.sortDropZones(this._tempZones);

            if (this.topOnly)
            {

                if (this._temp.length)
                {
                    this._temp.splice(1);
                }

                if (this._tempZones.length)
                {
                    this._tempZones.splice(1);
                }
            }

            total += this.processOverOutEvents(pointer);

            if (this.getDragState(pointer) === 2)
            {
                this.processDragThresholdEvent(pointer, time);
            }

            if (total > 0)
            {

                captured = true;
            }
        }

        return captured;
    },

    update: function (type, pointers)
    {
        if (!this.isActive())
        {
            return false;
        }

        var captured = false;

        for (var i = 0; i < pointers.length; i++)
        {
            var total = 0;
            var pointer = pointers[i];

            this._tempZones = [];

            this._temp = this.hitTestPointer(pointer);

            this.sortGameObjects(this._temp, pointer);
            this.sortDropZones(this._tempZones);

            if (this.topOnly)
            {

                if (this._temp.length)
                {
                    this._temp.splice(1);
                }

                if (this._tempZones.length)
                {
                    this._tempZones.splice(1);
                }
            }

            switch (type)
            {
                case CONST.MOUSE_DOWN:
                    total += this.processDragDownEvent(pointer);
                    total += this.processDownEvents(pointer);
                    total += this.processOverOutEvents(pointer);
                    break;

                case CONST.MOUSE_UP:
                    total += this.processDragUpEvent(pointer);
                    total += this.processUpEvents(pointer);
                    total += this.processOverOutEvents(pointer);
                    break;

                case CONST.TOUCH_START:
                    total += this.processDragDownEvent(pointer);
                    total += this.processDownEvents(pointer);
                    total += this.processOverEvents(pointer);
                    break;

                case CONST.TOUCH_END:
                case CONST.TOUCH_CANCEL:
                    total += this.processDragUpEvent(pointer);
                    total += this.processUpEvents(pointer);
                    total += this.processOutEvents(pointer);
                    break;

                case CONST.MOUSE_MOVE:
                case CONST.TOUCH_MOVE:
                    total += this.processDragMoveEvent(pointer);
                    total += this.processMoveEvents(pointer);
                    total += this.processOverOutEvents(pointer);
                    break;

                case CONST.MOUSE_WHEEL:
                    total += this.processWheelEvent(pointer);
                    break;
            }

            if (total > 0)
            {

                captured = true;
            }
        }

        this._updatedThisFrame = true;

        return captured;
    },

    clear: function (gameObject, skipQueue)
    {
        if (skipQueue === undefined) { skipQueue = false; }

        this.disable(gameObject);

        var input = gameObject.input;

        if (input)
        {
            this.removeDebug(gameObject);
            this.manager.resetCursor(input);

            input.gameObject = undefined;
            input.target = undefined;
            input.hitArea = undefined;
            input.hitAreaCallback = undefined;
            input.callbackContext = undefined;

            gameObject.input = null;
        }

        if (!skipQueue)
        {
            this.queueForRemoval(gameObject);
        }

        var index = this._draggable.indexOf(gameObject);

        if (index > -1)
        {
            this._draggable.splice(index, 1);
        }

        return gameObject;
    },

    disable: function (gameObject, resetCursor)
    {
        if (resetCursor === undefined) { resetCursor = false; }

        var input = gameObject.input;

        if (input)
        {
            input.enabled = false;
            input.dragState = 0;
        }

        var drag = this._drag;
        var over = this._over;
        var manager = this.manager;

        for (var i = 0, index; i < manager.pointers.length; i++)
        {
            index = drag[i].indexOf(gameObject);

            if (index > -1)
            {
                drag[i].splice(index, 1);
            }

            index = over[i].indexOf(gameObject);

            if (index > -1)
            {
                over[i].splice(index, 1);
            }
        }

        if (resetCursor)
        {
            this.resetCursor();
        }

        return this;
    },

    enable: function (gameObject, hitArea, hitAreaCallback, dropZone)
    {
        if (dropZone === undefined) { dropZone = false; }

        if (gameObject.input)
        {

            gameObject.input.enabled = true;
        }
        else
        {

            this.setHitArea(gameObject, hitArea, hitAreaCallback);
        }

        if (gameObject.input && dropZone && !gameObject.input.dropZone)
        {
            gameObject.input.dropZone = dropZone;
        }

        return this;
    },

    hitTestPointer: function (pointer)
    {
        var cameras = this.cameras.getCamerasBelowPointer(pointer);

        for (var c = 0; c < cameras.length; c++)
        {
            var camera = cameras[c];

            var over = this.manager.hitTest(pointer, this._list, camera);

            for (var i = 0; i < over.length; i++)
            {
                var obj = over[i];

                if (obj.input.dropZone)
                {
                    this._tempZones.push(obj);
                }
            }

            if (over.length > 0)
            {
                pointer.camera = camera;

                return over;
            }
        }

        pointer.camera = cameras[0];

        return [];
    },

    processDownEvents: function (pointer)
    {
        var total = 0;
        var currentlyOver = this._temp;

        var _eventData = this._eventData;
        var _eventContainer = this._eventContainer;

        _eventData.cancelled = false;

        for (var i = 0; i < currentlyOver.length; i++)
        {
            var gameObject = currentlyOver[i];

            if (!gameObject.input || !gameObject.input.enabled)
            {
                continue;
            }

            total++;

            gameObject.emit(Events.GAMEOBJECT_POINTER_DOWN, pointer, gameObject.input.localX, gameObject.input.localY, _eventContainer);

            if (_eventData.cancelled || !this.isActive())
            {

                break;
            }

            if (gameObject.input && gameObject.input.enabled)
            {

                this.emit(Events.GAMEOBJECT_DOWN, pointer, gameObject, _eventContainer);

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }
            }
        }

        if (!_eventData.cancelled && this.isActive())
        {
            if (pointer.downElement === this.manager.game.canvas)
            {

                this.emit(Events.POINTER_DOWN, pointer, currentlyOver);
            }
            else
            {

                this.emit(Events.POINTER_DOWN_OUTSIDE, pointer);
            }
        }

        return total;
    },

    getDragState: function (pointer)
    {
        return this._dragState[pointer.id];
    },

    setDragState: function (pointer, state)
    {
        this._dragState[pointer.id] = state;
    },

    processDragThresholdEvent: function (pointer, time)
    {
        var passed = false;
        var timeThreshold = this.dragTimeThreshold;
        var distanceThreshold = this.dragDistanceThreshold;

        if (distanceThreshold > 0 && DistanceBetween(pointer.x, pointer.y, pointer.downX, pointer.downY) >= distanceThreshold)
        {

            passed = true;
        }
        else if (timeThreshold > 0 && (time >= pointer.downTime + timeThreshold))
        {

            passed = true;
        }

        if (passed)
        {
            this.setDragState(pointer, 3);

            return this.processDragStartList(pointer);
        }
    },

    processDragStartList: function (pointer)
    {

        if (this.getDragState(pointer) !== 3)
        {
            return 0;
        }

        var list = this._drag[pointer.id];

        if (list.length > 1)
        {
            list = list.slice(0);
        }

        for (var i = 0; i < list.length; i++)
        {
            var gameObject = list[i];

            var input = gameObject.input;

            input.dragState = 2;

            input.dragStartX = gameObject.x;
            input.dragStartY = gameObject.y;

            input.dragStartXGlobal = pointer.worldX;
            input.dragStartYGlobal = pointer.worldY;

            input.dragStartCamera = pointer.camera;

            input.dragX = input.dragStartXGlobal - input.dragStartX;
            input.dragY = input.dragStartYGlobal - input.dragStartY;

            gameObject.emit(Events.GAMEOBJECT_DRAG_START, pointer, input.dragX, input.dragY);

            this.emit(Events.DRAG_START, pointer, gameObject);
        }

        this.setDragState(pointer, 4);

        return list.length;
    },

    processDragDownEvent: function (pointer)
    {
        var currentlyOver = this._temp;

        if (this._draggable.length === 0 || currentlyOver.length === 0 || !pointer.primaryDown || this.getDragState(pointer) !== 0)
        {

            return 0;
        }

        this.setDragState(pointer, 1);

        var draglist = [];

        for (var i = 0; i < currentlyOver.length; i++)
        {
            var gameObject = currentlyOver[i];

            if (gameObject.input.draggable && (gameObject.input.dragState === 0))
            {
                draglist.push(gameObject);
            }
        }

        if (draglist.length === 0)
        {
            this.setDragState(pointer, 0);

            return 0;
        }
        else if (draglist.length > 1)
        {
            this.sortGameObjects(draglist, pointer);

            if (this.topOnly)
            {
                draglist.splice(1);
            }
        }

        this._drag[pointer.id] = draglist;

        if (this.dragDistanceThreshold === 0 && this.dragTimeThreshold === 0)
        {

            this.setDragState(pointer, 3);

            return this.processDragStartList(pointer);
        }
        else
        {

            this.setDragState(pointer, 2);

            return 0;
        }
    },

    processDragMoveEvent: function (pointer)
    {

        if (this.getDragState(pointer) === 2)
        {
            this.processDragThresholdEvent(pointer, this.manager.game.loop.now);
        }

        if (this.getDragState(pointer) !== 4)
        {
            return 0;
        }

        var dropZones = this._tempZones;

        var list = this._drag[pointer.id];

        if (list.length > 1)
        {
            list = list.slice(0);
        }

        for (var i = 0; i < list.length; i++)
        {
            var gameObject = list[i];

            var input = gameObject.input;

            var target = input.target;

            if (target)
            {
                var index = dropZones.indexOf(target);

                if (index === 0)
                {

                    gameObject.emit(Events.GAMEOBJECT_DRAG_OVER, pointer, target);

                    this.emit(Events.DRAG_OVER, pointer, gameObject, target);
                }
                else if (index > 0)
                {

                    gameObject.emit(Events.GAMEOBJECT_DRAG_LEAVE, pointer, target);

                    this.emit(Events.DRAG_LEAVE, pointer, gameObject, target);

                    input.target = dropZones[0];

                    target = input.target;

                    gameObject.emit(Events.GAMEOBJECT_DRAG_ENTER, pointer, target);

                    this.emit(Events.DRAG_ENTER, pointer, gameObject, target);
                }
                else
                {

                    gameObject.emit(Events.GAMEOBJECT_DRAG_LEAVE, pointer, target);

                    this.emit(Events.DRAG_LEAVE, pointer, gameObject, target);

                    if (dropZones[0])
                    {
                        input.target = dropZones[0];

                        target = input.target;

                        gameObject.emit(Events.GAMEOBJECT_DRAG_ENTER, pointer, target);

                        this.emit(Events.DRAG_ENTER, pointer, gameObject, target);
                    }
                    else
                    {

                        input.target = null;
                    }
                }
            }
            else if (!target && dropZones[0])
            {
                input.target = dropZones[0];

                target = input.target;

                gameObject.emit(Events.GAMEOBJECT_DRAG_ENTER, pointer, target);

                this.emit(Events.DRAG_ENTER, pointer, gameObject, target);
            }

            var dragX;
            var dragY;

            var dragWorldXY = pointer.positionToCamera(input.dragStartCamera);

            if (!gameObject.parentContainer)
            {
                dragX = dragWorldXY.x - input.dragX;
                dragY = dragWorldXY.y - input.dragY;
            }
            else
            {
                var dx = dragWorldXY.x - input.dragStartXGlobal;
                var dy = dragWorldXY.y - input.dragStartYGlobal;

                var rotation = gameObject.getParentRotation();

                var dxRotated = dx * Math.cos(rotation) + dy * Math.sin(rotation);
                var dyRotated = dy * Math.cos(rotation) - dx * Math.sin(rotation);

                dxRotated *= (1 / gameObject.parentContainer.scaleX);
                dyRotated *= (1 / gameObject.parentContainer.scaleY);

                dragX = dxRotated + input.dragStartX;
                dragY = dyRotated + input.dragStartY;
            }

            gameObject.emit(Events.GAMEOBJECT_DRAG, pointer, dragX, dragY);

            this.emit(Events.DRAG, pointer, gameObject, dragX, dragY);
        }

        return list.length;
    },

    processDragUpEvent: function (pointer)
    {

        var list = this._drag[pointer.id];

        if (list.length > 1)
        {
            list = list.slice(0);
        }

        for (var i = 0; i < list.length; i++)
        {
            var gameObject = list[i];

            var input = gameObject.input;

            if (input && input.dragState === 2)
            {
                input.dragState = 0;

                input.dragX = input.localX - gameObject.displayOriginX;
                input.dragY = input.localY - gameObject.displayOriginY;

                input.dragStartCamera = null;

                var dropped = false;

                var target = input.target;

                if (target)
                {
                    gameObject.emit(Events.GAMEOBJECT_DROP, pointer, target);

                    this.emit(Events.DROP, pointer, gameObject, target);

                    input.target = null;

                    dropped = true;
                }

                if (gameObject.input && gameObject.input.enabled)
                {
                    gameObject.emit(Events.GAMEOBJECT_DRAG_END, pointer, input.dragX, input.dragY, dropped);

                    this.emit(Events.DRAG_END, pointer, gameObject, dropped);
                }
            }
        }

        this.setDragState(pointer, 0);

        list.splice(0);

        return 0;
    },

    processMoveEvents: function (pointer)
    {
        var total = 0;
        var currentlyOver = this._temp;

        var _eventData = this._eventData;
        var _eventContainer = this._eventContainer;

        _eventData.cancelled = false;

        for (var i = 0; i < currentlyOver.length; i++)
        {
            var gameObject = currentlyOver[i];

            if (!gameObject.input || !gameObject.input.enabled)
            {
                continue;
            }

            total++;

            gameObject.emit(Events.GAMEOBJECT_POINTER_MOVE, pointer, gameObject.input.localX, gameObject.input.localY, _eventContainer);

            if (_eventData.cancelled || !this.isActive())
            {

                break;
            }

            if (gameObject.input && gameObject.input.enabled)
            {
                this.emit(Events.GAMEOBJECT_MOVE, pointer, gameObject, _eventContainer);

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }

                if (this.topOnly)
                {
                    break;
                }
            }
        }

        if (!_eventData.cancelled && this.isActive())
        {
            this.emit(Events.POINTER_MOVE, pointer, currentlyOver);
        }

        return total;
    },

    processWheelEvent: function (pointer)
    {
        var total = 0;
        var currentlyOver = this._temp;

        var _eventData = this._eventData;
        var _eventContainer = this._eventContainer;

        _eventData.cancelled = false;

        var dx = pointer.deltaX;
        var dy = pointer.deltaY;
        var dz = pointer.deltaZ;

        for (var i = 0; i < currentlyOver.length; i++)
        {
            var gameObject = currentlyOver[i];

            if (!gameObject.input || !gameObject.input.enabled)
            {
                continue;
            }

            total++;

            gameObject.emit(Events.GAMEOBJECT_POINTER_WHEEL, pointer, dx, dy, dz, _eventContainer);

            if (_eventData.cancelled || !this.isActive())
            {

                break;
            }

            if (gameObject.input && gameObject.input.enabled)
            {
                this.emit(Events.GAMEOBJECT_WHEEL, pointer, gameObject, dx, dy, dz, _eventContainer);

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }
            }
        }

        if (!_eventData.cancelled && this.isActive())
        {
            this.emit(Events.POINTER_WHEEL, pointer, currentlyOver, dx, dy, dz);
        }

        return total;
    },

    processOverEvents: function (pointer)
    {
        var currentlyOver = this._temp;

        var totalInteracted = 0;

        var total = currentlyOver.length;

        var justOver = [];

        if (total > 0)
        {
            var manager = this.manager;

            var _eventData = this._eventData;
            var _eventContainer = this._eventContainer;

            _eventData.cancelled = false;

            for (var i = 0; i < total; i++)
            {
                var gameObject = currentlyOver[i];

                if (!gameObject.input || !gameObject.input.enabled)
                {
                    continue;
                }

                justOver.push(gameObject);

                manager.setCursor(gameObject.input);

                gameObject.emit(Events.GAMEOBJECT_POINTER_OVER, pointer, gameObject.input.localX, gameObject.input.localY, _eventContainer);

                totalInteracted++;

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }

                if (gameObject.input && gameObject.input.enabled)
                {
                    this.emit(Events.GAMEOBJECT_OVER, pointer, gameObject, _eventContainer);

                    if (_eventData.cancelled || !this.isActive())
                    {

                        break;
                    }
                }
            }

            if (!_eventData.cancelled && this.isActive())
            {
                this.emit(Events.POINTER_OVER, pointer, justOver);
            }
        }

        this._over[pointer.id] = justOver;

        return totalInteracted;
    },

    processOutEvents: function (pointer)
    {
        var previouslyOver = this._over[pointer.id];

        var totalInteracted = 0;

        var total = previouslyOver.length;

        if (total > 0)
        {
            var manager = this.manager;

            var _eventData = this._eventData;
            var _eventContainer = this._eventContainer;

            _eventData.cancelled = false;

            this.sortGameObjects(previouslyOver, pointer);

            for (var i = 0; i < total; i++)
            {
                var gameObject = previouslyOver[i];

                gameObject = previouslyOver[i];

                if (!gameObject.input || !gameObject.input.enabled)
                {
                    continue;
                }

                manager.resetCursor(gameObject.input);

                gameObject.emit(Events.GAMEOBJECT_POINTER_OUT, pointer, _eventContainer);

                totalInteracted++;

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }

                if (gameObject.input && gameObject.input.enabled)
                {
                    this.emit(Events.GAMEOBJECT_OUT, pointer, gameObject, _eventContainer);

                    if (_eventData.cancelled || !this.isActive())
                    {

                        break;
                    }
                }
            }

            if (!_eventData.cancelled && this.isActive())
            {
                this.emit(Events.POINTER_OUT, pointer, previouslyOver);
            }

            this._over[pointer.id] = [];
        }

        return totalInteracted;
    },

    processOverOutEvents: function (pointer)
    {
        var currentlyOver = this._temp;

        var i;
        var gameObject;
        var justOut = [];
        var justOver = [];
        var stillOver = [];
        var previouslyOver = this._over[pointer.id];
        var currentlyDragging = this._drag[pointer.id];

        var manager = this.manager;

        for (i = 0; i < previouslyOver.length; i++)
        {
            gameObject = previouslyOver[i];

            if (currentlyOver.indexOf(gameObject) === -1 && currentlyDragging.indexOf(gameObject) === -1)
            {

                justOut.push(gameObject);
            }
            else
            {

                stillOver.push(gameObject);
            }
        }

        for (i = 0; i < currentlyOver.length; i++)
        {
            gameObject = currentlyOver[i];

            if (previouslyOver.indexOf(gameObject) === -1)
            {
                justOver.push(gameObject);
            }
        }

        var total = justOut.length;

        var totalInteracted = 0;

        var _eventData = this._eventData;
        var _eventContainer = this._eventContainer;

        _eventData.cancelled = false;

        if (total > 0)
        {
            this.sortGameObjects(justOut, pointer);

            for (i = 0; i < total; i++)
            {
                gameObject = justOut[i];

                if (!gameObject.input || !gameObject.input.enabled)
                {
                    continue;
                }

                manager.resetCursor(gameObject.input);

                gameObject.emit(Events.GAMEOBJECT_POINTER_OUT, pointer, _eventContainer);

                totalInteracted++;

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }

                if (gameObject.input && gameObject.input.enabled)
                {
                    this.emit(Events.GAMEOBJECT_OUT, pointer, gameObject, _eventContainer);

                    if (_eventData.cancelled || !this.isActive())
                    {

                        break;
                    }
                }
            }

            if (!_eventData.cancelled || this.isActive())
            {
                this.emit(Events.POINTER_OUT, pointer, justOut);
            }
        }

        total = justOver.length;

        _eventData.cancelled = false;

        if (total > 0)
        {
            this.sortGameObjects(justOver, pointer);

            for (i = 0; i < total; i++)
            {
                gameObject = justOver[i];

                if (!gameObject.input || !gameObject.input.enabled)
                {
                    continue;
                }

                manager.setCursor(gameObject.input);

                gameObject.emit(Events.GAMEOBJECT_POINTER_OVER, pointer, gameObject.input.localX, gameObject.input.localY, _eventContainer);

                totalInteracted++;

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }

                if (gameObject.input && gameObject.input.enabled)
                {
                    this.emit(Events.GAMEOBJECT_OVER, pointer, gameObject, _eventContainer);

                    if (_eventData.cancelled || !this.isActive())
                    {

                        break;
                    }
                }
            }

            if (!_eventData.cancelled && this.isActive())
            {
                this.emit(Events.POINTER_OVER, pointer, justOver);
            }
        }

        previouslyOver = stillOver.concat(justOver);

        this._over[pointer.id] = this.sortGameObjects(previouslyOver, pointer);

        return totalInteracted;
    },

    processUpEvents: function (pointer)
    {
        var currentlyOver = this._temp;

        var _eventData = this._eventData;
        var _eventContainer = this._eventContainer;

        _eventData.cancelled = false;

        for (var i = 0; i < currentlyOver.length; i++)
        {
            var gameObject = currentlyOver[i];

            if (!gameObject.input || !gameObject.input.enabled)
            {
                continue;
            }

            gameObject.emit(Events.GAMEOBJECT_POINTER_UP, pointer, gameObject.input.localX, gameObject.input.localY, _eventContainer);

            if (_eventData.cancelled || !this.isActive())
            {

                break;
            }

            if (gameObject.input && gameObject.input.enabled)
            {

                this.emit(Events.GAMEOBJECT_UP, pointer, gameObject, _eventContainer);

                if (_eventData.cancelled || !this.isActive())
                {

                    break;
                }
            }
        }

        if (!_eventData.cancelled && this.isActive())
        {
            if (pointer.upElement === this.manager.game.canvas)
            {
                this.emit(Events.POINTER_UP, pointer, currentlyOver);
            }
            else
            {
                this.emit(Events.POINTER_UP_OUTSIDE, pointer);
            }
        }

        return currentlyOver.length;
    },

    forceDownState: function (pointer, gameObject)
    {
        this.forceState(pointer, gameObject, Events.GAMEOBJECT_POINTER_DOWN, Events.GAMEOBJECT_DOWN, false);
    },

    forceUpState: function (pointer, gameObject)
    {
        this.forceState(pointer, gameObject, Events.GAMEOBJECT_POINTER_UP, Events.GAMEOBJECT_UP, false);
    },

    forceOverState: function (pointer, gameObject)
    {
        this.forceState(pointer, gameObject, Events.GAMEOBJECT_POINTER_OVER, Events.GAMEOBJECT_OVER, true);
    },

    forceOutState: function (pointer, gameObject)
    {
        this.forceState(pointer, gameObject, Events.GAMEOBJECT_POINTER_OUT, Events.GAMEOBJECT_OUT, false);
    },

    forceState: function (pointer, gameObject, gameObjectEvent, inputPluginEvent, setCursor)
    {
        var _eventData = this._eventData;
        var _eventContainer = this._eventContainer;

        _eventData.cancelled = false;

        if (gameObject.input && gameObject.input.enabled)
        {
            gameObject.emit(gameObjectEvent, pointer, gameObject.input.localX, gameObject.input.localY, _eventContainer);

            if (setCursor)
            {
                this.setCursor(gameObject.input);
            }

            if (!_eventData.cancelled && this.isActive() && gameObject.input && gameObject.input.enabled)
            {
                this.emit(inputPluginEvent, pointer, gameObject, _eventContainer);
            }
        }
    },

    queueForInsertion: function (child)
    {
        if (this._pendingInsertion.indexOf(child) === -1 && this._list.indexOf(child) === -1)
        {
            this._pendingInsertion.push(child);
        }

        return this;
    },

    queueForRemoval: function (child)
    {
        this._pendingRemoval.push(child);

        return this;
    },

    setDraggable: function (gameObjects, value)
    {
        if (value === undefined) { value = true; }

        if (!Array.isArray(gameObjects))
        {
            gameObjects = [ gameObjects ];
        }

        for (var i = 0; i < gameObjects.length; i++)
        {
            var gameObject = gameObjects[i];

            gameObject.input.draggable = value;

            var index = this._draggable.indexOf(gameObject);

            if (value && index === -1)
            {
                this._draggable.push(gameObject);
            }
            else if (!value && index > -1)
            {
                this._draggable.splice(index, 1);
            }
        }

        return this;
    },

    makePixelPerfect: function (alphaTolerance)
    {
        if (alphaTolerance === undefined) { alphaTolerance = 1; }

        var textureManager = this.systems.textures;

        return CreatePixelPerfectHandler(textureManager, alphaTolerance);
    },

    setHitArea: function (gameObjects, hitArea, hitAreaCallback)
    {
        if (hitArea === undefined)
        {
            return this.setHitAreaFromTexture(gameObjects);
        }

        if (!Array.isArray(gameObjects))
        {
            gameObjects = [ gameObjects ];
        }

        var draggable = false;
        var dropZone = false;
        var cursor = false;
        var useHandCursor = false;
        var pixelPerfect = false;
        var customHitArea = true;

        if (IsPlainObject(hitArea) && Object.keys(hitArea).length)
        {
            var config = hitArea;

            var isMesh = gameObjects.some(function (gameObject)
            {
                return gameObject.hasOwnProperty('faces');
            });

            if (!isMesh)
            {
                hitArea = GetFastValue(config, 'hitArea', null);
                hitAreaCallback = GetFastValue(config, 'hitAreaCallback', null);

                pixelPerfect = GetFastValue(config, 'pixelPerfect', false);
                var alphaTolerance = GetFastValue(config, 'alphaTolerance', 1);

                if (pixelPerfect)
                {
                    hitArea = {};
                    hitAreaCallback = this.makePixelPerfect(alphaTolerance);
                }
            }

            draggable = GetFastValue(config, 'draggable', false);
            dropZone = GetFastValue(config, 'dropZone', false);
            cursor = GetFastValue(config, 'cursor', false);
            useHandCursor = GetFastValue(config, 'useHandCursor', false);

            if (!hitArea || !hitAreaCallback)
            {
                this.setHitAreaFromTexture(gameObjects);
                customHitArea = false;
            }
        }
        else if (typeof hitArea === 'function' && !hitAreaCallback)
        {
            hitAreaCallback = hitArea;
            hitArea = {};
        }

        for (var i = 0; i < gameObjects.length; i++)
        {
            var gameObject = gameObjects[i];

            if (pixelPerfect && gameObject.type === 'Container')
            {
                console.warn('Cannot pixelPerfect test a Container. Use a custom callback.');
                continue;
            }

            var io = (!gameObject.input) ? CreateInteractiveObject(gameObject, hitArea, hitAreaCallback) : gameObject.input;

            io.customHitArea = customHitArea;
            io.dropZone = dropZone;
            io.cursor = (useHandCursor) ? 'pointer' : cursor;

            gameObject.input = io;

            if (draggable)
            {
                this.setDraggable(gameObject);
            }

            this.queueForInsertion(gameObject);
        }

        return this;
    },

    setHitAreaCircle: function (gameObjects, x, y, radius, callback)
    {
        if (callback === undefined) { callback = CircleContains; }

        var shape = new Circle(x, y, radius);

        return this.setHitArea(gameObjects, shape, callback);
    },

    setHitAreaEllipse: function (gameObjects, x, y, width, height, callback)
    {
        if (callback === undefined) { callback = EllipseContains; }

        var shape = new Ellipse(x, y, width, height);

        return this.setHitArea(gameObjects, shape, callback);
    },

    setHitAreaFromTexture: function (gameObjects, callback)
    {
        if (callback === undefined) { callback = RectangleContains; }

        if (!Array.isArray(gameObjects))
        {
            gameObjects = [ gameObjects ];
        }

        for (var i = 0; i < gameObjects.length; i++)
        {
            var gameObject = gameObjects[i];

            var frame = gameObject.frame;

            var width = 0;
            var height = 0;

            if (gameObject.width)
            {
                width = gameObject.width;
                height = gameObject.height;
            }
            else if (frame)
            {
                width = frame.realWidth;
                height = frame.realHeight;
            }

            if (gameObject.type === 'Container' && (width === 0 || height === 0))
            {
                console.warn('Container.setInteractive must specify a Shape or call setSize() first');
                continue;
            }

            if (width !== 0 && height !== 0)
            {
                gameObject.input = CreateInteractiveObject(gameObject, new Rectangle(0, 0, width, height), callback);

                this.queueForInsertion(gameObject);
            }
        }

        return this;
    },

    setHitAreaRectangle: function (gameObjects, x, y, width, height, callback)
    {
        if (callback === undefined) { callback = RectangleContains; }

        var shape = new Rectangle(x, y, width, height);

        return this.setHitArea(gameObjects, shape, callback);
    },

    setHitAreaTriangle: function (gameObjects, x1, y1, x2, y2, x3, y3, callback)
    {
        if (callback === undefined) { callback = TriangleContains; }

        var shape = new Triangle(x1, y1, x2, y2, x3, y3);

        return this.setHitArea(gameObjects, shape, callback);
    },

    enableDebug: function (gameObject, color)
    {
        if (color === undefined) { color = 0x00ff00; }

        var input = gameObject.input;

        if (!input || !input.hitArea)
        {
            return this;
        }

        var shape = input.hitArea;
        var shapeType = shape.type;
        var debug = input.hitAreaDebug;
        var factory = this.systems.add;
        var updateList = this.systems.updateList;

        if (debug)
        {
            updateList.remove(debug);

            debug.destroy();

            debug = null;
        }

        var offsetx = 0;
        var offsety = 0;

        switch (shapeType)
        {
            case GEOM_CONST.CIRCLE:
                debug = factory.arc(0, 0, shape.radius);
                offsetx = shape.x - shape.radius;
                offsety = shape.y - shape.radius;
                break;

            case GEOM_CONST.ELLIPSE:
                debug = factory.ellipse(0, 0, shape.width, shape.height);
                offsetx = shape.x - shape.width / 2;
                offsety = shape.y - shape.height / 2;
                break;

            case GEOM_CONST.LINE:
                debug = factory.line(0, 0, shape.x1, shape.y1, shape.x2, shape.y2);
                break;

            case GEOM_CONST.POLYGON:
                debug = factory.polygon(0, 0, shape.points);
                break;

            case GEOM_CONST.RECTANGLE:
                debug = factory.rectangle(0, 0, shape.width, shape.height);
                offsetx = shape.x;
                offsety = shape.y;
                break;

            case GEOM_CONST.TRIANGLE:
                debug = factory.triangle(0, 0, shape.x1, shape.y1, shape.x2, shape.y2, shape.x3, shape.y3);
                break;
        }

        if (debug)
        {
            debug.isFilled = false;
            debug.strokeColor = color;

            debug.preUpdate = function ()
            {
                debug.setVisible(gameObject.visible);

                debug.setStrokeStyle(1 / gameObject.scale, debug.strokeColor);

                debug.setDisplayOrigin(gameObject.displayOriginX, gameObject.displayOriginY);

                var x = gameObject.x;
                var y = gameObject.y;
                var rotation = gameObject.rotation;
                var scaleX = gameObject.scaleX;
                var scaleY = gameObject.scaleY;

                if (gameObject.parentContainer)
                {
                    var matrix = gameObject.getWorldTransformMatrix();

                    x = matrix.tx;
                    y = matrix.ty;
                    rotation = matrix.rotation;
                    scaleX = matrix.scaleX;
                    scaleY = matrix.scaleY;
                }

                debug.setRotation(rotation);
                debug.setScale(scaleX, scaleY);
                debug.setPosition(x + offsetx * scaleX, y + offsety * scaleY);
                debug.setScrollFactor(gameObject.scrollFactorX, gameObject.scrollFactorY);
                debug.setDepth(gameObject.depth);
            };

            updateList.add(debug);

            input.hitAreaDebug = debug;
        }

        return this;
    },

    removeDebug: function (gameObject)
    {
        var input = gameObject.input;

        if (input && input.hitAreaDebug)
        {
            var debug = input.hitAreaDebug;

            debug.destroy();

            input.hitAreaDebug = null;
        }

        return this;
    },

    setPollAlways: function ()
    {
        return this.setPollRate(0);
    },

    setPollOnMove: function ()
    {
        return this.setPollRate(-1);
    },

    setPollRate: function (value)
    {
        this.pollRate = value;
        this._pollTimer = 0;

        return this;
    },

    setGlobalTopOnly: function (value)
    {
        this.manager.globalTopOnly = value;

        return this;
    },

    setTopOnly: function (value)
    {
        this.topOnly = value;

        return this;
    },

    sortGameObjects: function (gameObjects, pointer)
    {
        if (gameObjects.length < 2 || !pointer.camera)
        {
            return gameObjects;
        }

        var list = pointer.camera.renderList;

        return gameObjects.sort(function (childA, childB)
        {
            var indexA = Math.max(list.indexOf(childA), 0);
            var indexB = Math.max(list.indexOf(childB), 0);

            return indexB - indexA;
        });
    },

    sortDropZones: function (gameObjects)
    {
        if (gameObjects.length < 2)
        {
            return gameObjects;
        }

        this.scene.sys.depthSort();

        return gameObjects.sort(this.sortDropZoneHandler.bind(this));
    },

    sortDropZoneHandler: function (childA, childB)
    {
        if (!childA.parentContainer && !childB.parentContainer)
        {

            return this.displayList.getIndex(childB) - this.displayList.getIndex(childA);
        }
        else if (childA.parentContainer === childB.parentContainer)
        {

            return childB.parentContainer.getIndex(childB) - childA.parentContainer.getIndex(childA);
        }
        else if (childA.parentContainer === childB)
        {

            return -1;
        }
        else if (childB.parentContainer === childA)
        {

            return 1;
        }
        else
        {

            var listA = childA.getIndexList();
            var listB = childB.getIndexList();
            var len = Math.min(listA.length, listB.length);

            for (var i = 0; i < len; i++)
            {
                var indexA = listA[i];
                var indexB = listB[i];

                if (indexA === indexB)
                {

                    continue;
                }
                else
                {

                    return indexB - indexA;
                }
            }

            return listB.length - listA.length;
        }

        return 0;
    },

    stopPropagation: function ()
    {
        this.manager._tempSkip = true;

        return this;
    },

    addPointer: function (quantity)
    {
        return this.manager.addPointer(quantity);
    },

    setDefaultCursor: function (cursor)
    {
        this.manager.setDefaultCursor(cursor);

        return this;
    },

    transitionIn: function ()
    {
        this.enabled = this.settings.transitionAllowInput;
    },

    transitionComplete: function ()
    {
        if (!this.settings.transitionAllowInput)
        {
            this.enabled = true;
        }
    },

    transitionOut: function ()
    {
        this.enabled = this.settings.transitionAllowInput;
    },

    shutdown: function ()
    {

        this.pluginEvents.emit(Events.SHUTDOWN);

        this._temp.length = 0;
        this._list.length = 0;
        this._draggable.length = 0;
        this._pendingRemoval.length = 0;
        this._pendingInsertion.length = 0;
        this._dragState.length = 0;

        for (var i = 0; i < 10; i++)
        {
            this._drag[i] = [];
            this._over[i] = [];
        }

        this.removeAllListeners();

        var manager = this.manager;

        manager.canvas.style.cursor = manager.defaultCursor;

        var eventEmitter = this.systems.events;

        eventEmitter.off(SceneEvents.TRANSITION_START, this.transitionIn, this);
        eventEmitter.off(SceneEvents.TRANSITION_OUT, this.transitionOut, this);
        eventEmitter.off(SceneEvents.TRANSITION_COMPLETE, this.transitionComplete, this);
        eventEmitter.off(SceneEvents.PRE_UPDATE, this.preUpdate, this);

        manager.events.off(Events.GAME_OUT, this.onGameOut, this);
        manager.events.off(Events.GAME_OVER, this.onGameOver, this);

        eventEmitter.off(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    resetPointers: function ()
    {
        var pointers = this.manager.pointers;

        for (var i = 0; i < pointers.length; i++)
        {
            pointers[i].reset();
        }
    },

    destroy: function ()
    {
        this.shutdown();

        this.pluginEvents.emit(Events.DESTROY);

        this.pluginEvents.removeAllListeners();

        this.scene.sys.events.off(SceneEvents.START, this.start, this);

        this.scene = null;
        this.cameras = null;
        this.manager = null;
        this.events = null;
        this.mouse = null;
    },

    x: {

        get: function ()
        {
            return this.manager.activePointer.x;
        }

    },

    y: {

        get: function ()
        {
            return this.manager.activePointer.y;
        }

    },

    isOver: {

        get: function ()
        {
            return this.manager.isOver;
        }

    },

    mousePointer: {

        get: function ()
        {
            return this.manager.mousePointer;
        }

    },

    activePointer: {

        get: function ()
        {
            return this.manager.activePointer;
        }

    },

    pointer1: {

        get: function ()
        {
            return this.manager.pointers[1];
        }

    },

    pointer2: {

        get: function ()
        {
            return this.manager.pointers[2];
        }

    },

    pointer3: {

        get: function ()
        {
            return this.manager.pointers[3];
        }

    },

    pointer4: {

        get: function ()
        {
            return this.manager.pointers[4];
        }

    },

    pointer5: {

        get: function ()
        {
            return this.manager.pointers[5];
        }

    },

    pointer6: {

        get: function ()
        {
            return this.manager.pointers[6];
        }

    },

    pointer7: {

        get: function ()
        {
            return this.manager.pointers[7];
        }

    },

    pointer8: {

        get: function ()
        {
            return this.manager.pointers[8];
        }

    },

    pointer9: {

        get: function ()
        {
            return this.manager.pointers[9];
        }

    },

    pointer10: {

        get: function ()
        {
            return this.manager.pointers[10];
        }

    }

});

PluginCache.register('InputPlugin', InputPlugin, 'input');

module.exports = InputPlugin;
