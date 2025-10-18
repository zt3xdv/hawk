var CONST = require('./const');
var Class = require('../utils/Class');
var Clamp = require('../math/Clamp');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var GameEvents = require('../core/events');
var GetInnerHeight = require('../dom/GetInnerHeight');
var GetTarget = require('../dom/GetTarget');
var GetScreenOrientation = require('../dom/GetScreenOrientation');
var NOOP = require('../utils/NOOP');
var Rectangle = require('../geom/rectangle/Rectangle');
var Size = require('../structs/Size');
var SnapFloor = require('../math/snap/SnapFloor');
var Vector2 = require('../math/Vector2');
var Camera = require('../cameras/2d/Camera');

var ScaleManager = new Class({

    Extends: EventEmitter,

    initialize:

    function ScaleManager (game)
    {
        EventEmitter.call(this);

        this.game = game;

        this.canvas;

        this.canvasBounds = new Rectangle();

        this.parent = null;

        this.parentIsWindow = false;

        this.parentSize = new Size();

        this.gameSize = new Size();

        this.baseSize = new Size();

        this.displaySize = new Size();

        this.scaleMode = CONST.SCALE_MODE.NONE;

        this.zoom = 1;

        this._resetZoom = false;

        this.displayScale = new Vector2(1, 1);

        this.autoRound = false;

        this.autoCenter = CONST.CENTER.NO_CENTER;

        this.orientation = CONST.ORIENTATION.LANDSCAPE;

        this.fullscreen;

        this.fullscreenTarget = null;

        this._createdFullscreenTarget = false;

        this.dirty = false;

        this.resizeInterval = 500;

        this._lastCheck = 0;

        this._checkOrientation = false;

        this.domlisteners = {

            orientationChange: NOOP,
            windowResize: NOOP,
            fullScreenChange: NOOP,
            fullScreenError: NOOP

        };
    },

    preBoot: function ()
    {

        this.parseConfig(this.game.config);

        this.game.events.once(GameEvents.BOOT, this.boot, this);
    },

    boot: function ()
    {
        var game = this.game;

        this.canvas = game.canvas;

        this.fullscreen = game.device.fullscreen;

        var scaleMode = this.scaleMode;

        if (scaleMode !== CONST.SCALE_MODE.RESIZE && scaleMode !== CONST.SCALE_MODE.EXPAND)
        {
            this.displaySize.setAspectMode(scaleMode);
        }

        if (scaleMode === CONST.SCALE_MODE.NONE)
        {
            this.resize(this.width, this.height);
        }
        else
        {
            this.getParentBounds();

            if (this.parentSize.width > 0 && this.parentSize.height > 0)
            {
                this.displaySize.setParent(this.parentSize);
            }

            this.refresh();
        }

        game.events.on(GameEvents.PRE_STEP, this.step, this);
        game.events.once(GameEvents.READY, this.refresh, this);
        game.events.once(GameEvents.DESTROY, this.destroy, this);

        this.startListeners();
    },

    parseConfig: function (config)
    {

        this.getParent(config);

        this.getParentBounds();

        var width = config.width;
        var height = config.height;
        var scaleMode = config.scaleMode;
        var zoom = config.zoom;
        var autoRound = config.autoRound;

        if (typeof width === 'string')
        {

            if (width.substr(-1) !== '%')
            {
                width = parseInt(width, 10);
            }
            else
            {

                var parentWidth = this.parentSize.width;

                if (parentWidth === 0)
                {
                    parentWidth = window.innerWidth;
                }

                var parentScaleX = parseInt(width, 10) / 100;

                width = Math.floor(parentWidth * parentScaleX);
            }

        }

        if (typeof height === 'string')
        {

            if (height.substr(-1) !== '%')
            {
                height = parseInt(height, 10);
            }
            else
            {

                var parentHeight = this.parentSize.height;

                if (parentHeight === 0)
                {
                    parentHeight = window.innerHeight;
                }

                var parentScaleY = parseInt(height, 10) / 100;

                height = Math.floor(parentHeight * parentScaleY);
            }
        }

        this.scaleMode = scaleMode;

        this.autoRound = autoRound;

        this.autoCenter = config.autoCenter;

        this.resizeInterval = config.resizeInterval;

        if (autoRound)
        {
            width = Math.floor(width);
            height = Math.floor(height);
        }

        this.gameSize.setSize(width, height);

        if (zoom === CONST.ZOOM.MAX_ZOOM)
        {
            zoom = this.getMaxZoom();
        }

        this.zoom = zoom;

        if (zoom !== 1)
        {
            this._resetZoom = true;
        }

        this.baseSize.setSize(width, height);

        if (autoRound)
        {
            this.baseSize.width = Math.floor(this.baseSize.width);
            this.baseSize.height = Math.floor(this.baseSize.height);
        }

        if (config.minWidth > 0)
        {
            this.displaySize.setMin(config.minWidth * zoom, config.minHeight * zoom);
        }

        if (config.maxWidth > 0)
        {
            this.displaySize.setMax(config.maxWidth * zoom, config.maxHeight * zoom);
        }

        this.displaySize.setSize(width, height);

        if (config.snapWidth > 0 || config.snapHeight > 0)
        {
            this.displaySize.setSnap(config.snapWidth, config.snapHeight);
        }

        this.orientation = GetScreenOrientation(width, height);
    },

    getParent: function (config)
    {
        var parent = config.parent;

        if (parent === null)
        {

            return;
        }

        this.parent = GetTarget(parent);
        this.parentIsWindow = (this.parent === document.body);

        if (config.expandParent && config.scaleMode !== CONST.SCALE_MODE.NONE)
        {
            var DOMRect = this.parent.getBoundingClientRect();

            if (this.parentIsWindow || DOMRect.height === 0)
            {
                document.documentElement.style.height = '100%';
                document.body.style.height = '100%';

                DOMRect = this.parent.getBoundingClientRect();

                if (!this.parentIsWindow && DOMRect.height === 0)
                {
                    this.parent.style.overflow = 'hidden';
                    this.parent.style.width = '100%';
                    this.parent.style.height = '100%';
                }
            }
        }

        if (config.fullscreenTarget && !this.fullscreenTarget)
        {
            this.fullscreenTarget = GetTarget(config.fullscreenTarget);
        }
    },

    getParentBounds: function ()
    {
        if (!this.parent)
        {
            return false;
        }

        var parentSize = this.parentSize;

        var DOMRect = this.parent.getBoundingClientRect();

        if (this.parentIsWindow && this.game.device.os.iOS)
        {
            DOMRect.height = GetInnerHeight(true);
        }

        var newWidth = DOMRect.width;
        var newHeight = DOMRect.height;

        if (parentSize.width !== newWidth || parentSize.height !== newHeight)
        {
            parentSize.setSize(newWidth, newHeight);

            return true;
        }
        else if (this.canvas)
        {
            var canvasBounds = this.canvasBounds;
            var canvasRect = this.canvas.getBoundingClientRect();

            if (canvasRect.x !== canvasBounds.x || canvasRect.y !== canvasBounds.y)
            {
                return true;
            }
        }

        return false;
    },

    lockOrientation: function (orientation)
    {
        var lock = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;

        if (lock)
        {
            return lock.call(screen, orientation);
        }

        return false;
    },

    setParentSize: function (width, height)
    {
        this.parentSize.setSize(width, height);

        return this.refresh();
    },

    setGameSize: function (width, height)
    {
        var autoRound = this.autoRound;

        if (autoRound)
        {
            width = Math.floor(width);
            height = Math.floor(height);
        }

        var previousWidth = this.width;
        var previousHeight = this.height;

        this.gameSize.resize(width, height);

        this.baseSize.resize(width, height);

        if (autoRound)
        {
            this.baseSize.width = Math.floor(this.baseSize.width);
            this.baseSize.height = Math.floor(this.baseSize.height);
        }

        this.displaySize.setAspectRatio(width / height);

        this.canvas.width = this.baseSize.width;
        this.canvas.height = this.baseSize.height;

        return this.refresh(previousWidth, previousHeight);
    },

    resize: function (width, height)
    {
        var zoom = this.zoom;
        var autoRound = this.autoRound;

        if (autoRound)
        {
            width = Math.floor(width);
            height = Math.floor(height);
        }

        var previousWidth = this.width;
        var previousHeight = this.height;

        this.gameSize.resize(width, height);

        this.baseSize.resize(width, height);

        if (autoRound)
        {
            this.baseSize.width = Math.floor(this.baseSize.width);
            this.baseSize.height = Math.floor(this.baseSize.height);
        }

        this.displaySize.setSize((width * zoom), (height * zoom));

        this.canvas.width = this.baseSize.width;
        this.canvas.height = this.baseSize.height;

        var style = this.canvas.style;

        var styleWidth = width * zoom;
        var styleHeight = height * zoom;

        if (autoRound)
        {
            styleWidth = Math.floor(styleWidth);
            styleHeight = Math.floor(styleHeight);
        }

        if (styleWidth !== width || styleHeight !== height)
        {
            style.width = styleWidth + 'px';
            style.height = styleHeight + 'px';
        }

        return this.refresh(previousWidth, previousHeight);
    },

    setZoom: function (value)
    {
        this.zoom = value;
        this._resetZoom = true;

        return this.refresh();
    },

    setMaxZoom: function ()
    {
        this.zoom = this.getMaxZoom();
        this._resetZoom = true;

        return this.refresh();
    },

    setSnap: function (snapWidth, snapHeight)
    {
        if (snapWidth === undefined) { snapWidth = 0; }
        if (snapHeight === undefined) { snapHeight = snapWidth; }

        this.displaySize.setSnap(snapWidth, snapHeight);

        return this.refresh();
    },

    refresh: function (previousWidth, previousHeight)
    {
        if (previousWidth === undefined) { previousWidth = this.width; }
        if (previousHeight === undefined) { previousHeight = this.height; }

        this.updateScale();
        this.updateBounds();
        this.updateOrientation();

        this.displayScale.set(this.baseSize.width / this.canvasBounds.width, this.baseSize.height / this.canvasBounds.height);

        var domContainer = this.game.domContainer;

        if (domContainer)
        {
            this.baseSize.setCSS(domContainer);

            var canvasStyle = this.canvas.style;
            var domStyle = domContainer.style;

            domStyle.transform = 'scale(' + this.displaySize.width / this.baseSize.width + ',' + this.displaySize.height / this.baseSize.height + ')';

            domStyle.marginLeft = canvasStyle.marginLeft;
            domStyle.marginTop = canvasStyle.marginTop;
        }

        this.emit(Events.RESIZE, this.gameSize, this.baseSize, this.displaySize, previousWidth, previousHeight);

        return this;
    },

    updateOrientation: function ()
    {
        if (this._checkOrientation)
        {
            this._checkOrientation = false;

            var newOrientation = GetScreenOrientation(this.width, this.height);

            if (newOrientation !== this.orientation)
            {
                this.orientation = newOrientation;

                this.emit(Events.ORIENTATION_CHANGE, newOrientation);
            }
        }
    },

    updateScale: function ()
    {
        var style = this.canvas.style;

        var width = this.gameSize.width;
        var height = this.gameSize.height;

        var styleWidth;
        var styleHeight;

        var zoom = this.zoom;
        var autoRound = this.autoRound;

        if (this.scaleMode === CONST.SCALE_MODE.NONE)
        {

            this.displaySize.setSize((width * zoom), (height * zoom));

            styleWidth = this.displaySize.width;
            styleHeight = this.displaySize.height;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }

            if (this._resetZoom)
            {
                style.width = styleWidth + 'px';
                style.height = styleHeight + 'px';

                this._resetZoom = false;
            }
        }
        else if (this.scaleMode === CONST.SCALE_MODE.RESIZE)
        {

            this.displaySize.setSize(this.parentSize.width, this.parentSize.height);

            this.gameSize.setSize(this.displaySize.width, this.displaySize.height);

            this.baseSize.setSize(this.displaySize.width, this.displaySize.height);

            styleWidth = this.displaySize.width;
            styleHeight = this.displaySize.height;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }

            this.canvas.width = styleWidth;
            this.canvas.height = styleHeight;
        }
        else if (this.scaleMode === CONST.SCALE_MODE.EXPAND)
        {

            var baseWidth = this.game.config.width;
            var baseHeight = this.game.config.height;

            var windowWidth = this.parentSize.width;
            var windowHeight = this.parentSize.height;

            var scaleX = windowWidth / baseWidth;
            var scaleY = windowHeight / baseHeight;

            var canvasWidth;
            var canvasHeight;

            if (scaleX < scaleY)
            {
                canvasWidth = baseWidth;
                canvasHeight = (scaleX !== 0)? windowHeight / scaleX : baseHeight;
            }
            else
            {
                canvasWidth = (scaleY !== 0)? windowWidth / scaleY : baseWidth;
                canvasHeight = baseHeight;
            }

            var clampedCanvasWidth = Clamp(canvasWidth, this.displaySize.minWidth, this.displaySize.maxWidth);
            var clampedCanvasHeight = Clamp(canvasHeight, this.displaySize.minHeight, this.displaySize.maxHeight);

            this.baseSize.setSize(clampedCanvasWidth, clampedCanvasHeight);

            this.gameSize.setSize(clampedCanvasWidth, clampedCanvasHeight);

            if (autoRound)
            {
                clampedCanvasWidth = Math.floor(clampedCanvasWidth);
                clampedCanvasHeight = Math.floor(clampedCanvasHeight);
            }

            this.canvas.width = clampedCanvasWidth;
            this.canvas.height = clampedCanvasHeight;

            var clampedWindowWidth = windowWidth * (clampedCanvasWidth / canvasWidth);
            var clampedWindowHeight = windowHeight * (clampedCanvasHeight / canvasHeight);
            this.displaySize.setSize(clampedWindowWidth, clampedWindowHeight);

            styleWidth = this.displaySize.width;
            styleHeight = this.displaySize.height;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }

            style.width = styleWidth + 'px';
            style.height = styleHeight + 'px';

        }
        else
        {

            this.displaySize.setSize(this.parentSize.width, this.parentSize.height);

            styleWidth = this.displaySize.width;
            styleHeight = this.displaySize.height;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }

            style.width = styleWidth + 'px';
            style.height = styleHeight + 'px';
        }

        this.getParentBounds();

        this.updateCenter();
    },

    getMaxZoom: function ()
    {
        var zoomH = SnapFloor(this.parentSize.width, this.gameSize.width, 0, true);
        var zoomV = SnapFloor(this.parentSize.height, this.gameSize.height, 0, true);

        return Math.max(Math.min(zoomH, zoomV), 1);
    },

    updateCenter: function ()
    {
        var autoCenter = this.autoCenter;

        if (autoCenter === CONST.CENTER.NO_CENTER)
        {
            return;
        }

        var canvas = this.canvas;

        var style = canvas.style;

        var bounds = canvas.getBoundingClientRect();

        var width = bounds.width;
        var height = bounds.height;

        var offsetX = Math.floor((this.parentSize.width - width) / 2);
        var offsetY = Math.floor((this.parentSize.height - height) / 2);

        if (autoCenter === CONST.CENTER.CENTER_HORIZONTALLY)
        {
            offsetY = 0;
        }
        else if (autoCenter === CONST.CENTER.CENTER_VERTICALLY)
        {
            offsetX = 0;
        }

        style.marginLeft = offsetX + 'px';
        style.marginTop = offsetY + 'px';
    },

    updateBounds: function ()
    {
        var bounds = this.canvasBounds;
        var clientRect = this.canvas.getBoundingClientRect();

        bounds.x = clientRect.left + (window.pageXOffset || 0) - (document.documentElement.clientLeft || 0);
        bounds.y = clientRect.top + (window.pageYOffset || 0) - (document.documentElement.clientTop || 0);
        bounds.width = clientRect.width;
        bounds.height = clientRect.height;
    },

    transformX: function (pageX)
    {
        return (pageX - this.canvasBounds.left) * this.displayScale.x;
    },

    transformY: function (pageY)
    {
        return (pageY - this.canvasBounds.top) * this.displayScale.y;
    },

    startFullscreen: function (fullscreenOptions)
    {
        if (fullscreenOptions === undefined) { fullscreenOptions = { navigationUI: 'hide' }; }

        var fullscreen = this.fullscreen;

        if (!fullscreen.available)
        {
            this.emit(Events.FULLSCREEN_UNSUPPORTED);

            return;
        }

        if (!fullscreen.active)
        {
            var fsTarget = this.getFullscreenTarget();

            if (fullscreen.keyboard)
            {
                fsTarget[fullscreen.request](Element.ALLOW_KEYBOARD_INPUT);
            }
            else
            {
                fsTarget[fullscreen.request](fullscreenOptions);
            }
        }
    },

    fullscreenSuccessHandler: function ()
    {
        this.getParentBounds();

        this.refresh();

        this.emit(Events.ENTER_FULLSCREEN);
    },

    fullscreenErrorHandler: function (error)
    {
        this.removeFullscreenTarget();

        this.emit(Events.FULLSCREEN_FAILED, error);
    },

    getFullscreenTarget: function ()
    {
        if (!this.fullscreenTarget)
        {
            var fsTarget = document.createElement('div');

            fsTarget.style.margin = '0';
            fsTarget.style.padding = '0';
            fsTarget.style.width = '100%';
            fsTarget.style.height = '100%';

            this.fullscreenTarget = fsTarget;

            this._createdFullscreenTarget = true;
        }

        if (this._createdFullscreenTarget)
        {
            var canvasParent = this.canvas.parentNode;

            canvasParent.insertBefore(this.fullscreenTarget, this.canvas);

            this.fullscreenTarget.appendChild(this.canvas);
        }

        return this.fullscreenTarget;
    },

    removeFullscreenTarget: function ()
    {
        if (this._createdFullscreenTarget)
        {
            var fsTarget = this.fullscreenTarget;

            if (fsTarget && fsTarget.parentNode)
            {
                var parent = fsTarget.parentNode;

                parent.insertBefore(this.canvas, fsTarget);

                parent.removeChild(fsTarget);
            }
        }
    },

    stopFullscreen: function ()
    {
        var fullscreen = this.fullscreen;

        if (!fullscreen.available)
        {
            this.emit(Events.FULLSCREEN_UNSUPPORTED);

            return false;
        }

        if (fullscreen.active)
        {
            document[fullscreen.cancel]();
        }

        this.removeFullscreenTarget();
    },

    leaveFullScreenSuccessHandler: function ()
    {

        this.getParentBounds();

        this.emit(Events.LEAVE_FULLSCREEN);

        this.refresh();
    },

    toggleFullscreen: function (fullscreenOptions)
    {
        if (this.fullscreen.active)
        {
            this.stopFullscreen();
        }
        else
        {
            this.startFullscreen(fullscreenOptions);
        }
    },

    startListeners: function ()
    {
        var _this = this;
        var listeners = this.domlisteners;

        listeners.orientationChange = function ()
        {
            _this.updateBounds();

            _this._checkOrientation = true;
            _this.dirty = true;

            _this.refresh();
        };

        listeners.windowResize = function ()
        {
            _this.updateBounds();

            _this.dirty = true;
        };

        if (screen.orientation && screen.orientation.addEventListener)
        {
            screen.orientation.addEventListener('change', listeners.orientationChange, false);
        }
        else
        {
            window.addEventListener('orientationchange', listeners.orientationChange, false);
        }

        window.addEventListener('resize', listeners.windowResize, false);

        if (this.fullscreen.available)
        {
            listeners.fullScreenChange = function (event)
            {
                return _this.onFullScreenChange(event);
            };

            listeners.fullScreenError = function (event)
            {
                return _this.onFullScreenError(event);
            };

            var vendors = [ 'webkit', 'moz', '' ];

            vendors.forEach(function (prefix)
            {
                document.addEventListener(prefix + 'fullscreenchange', listeners.fullScreenChange, false);
                document.addEventListener(prefix + 'fullscreenerror', listeners.fullScreenError, false);
            });

            document.addEventListener('MSFullscreenChange', listeners.fullScreenChange, false);
            document.addEventListener('MSFullscreenError', listeners.fullScreenError, false);
        }
    },

    onFullScreenChange: function ()
    {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement)
        {
            this.fullscreenSuccessHandler();
        }
        else
        {

            this.stopFullscreen();
            this.leaveFullScreenSuccessHandler();
        }
    },

    onFullScreenError: function ()
    {
        this.removeFullscreenTarget();
    },

    getViewPort: function (camera, out)
    {
        if (!(camera instanceof Camera))
        {
            out = camera;
            camera = undefined;
        }

        if (out === undefined)
        {
            out = new Rectangle();
        }

        var baseSize = this.baseSize;
        var parentSize = this.parentSize;
        var canvasBounds = this.canvasBounds;
        var displayScale = this.displayScale;

        var x = (canvasBounds.x >= 0) ? 0 : -(canvasBounds.x * displayScale.x);

        var y = (canvasBounds.y >= 0) ? 0 : -(canvasBounds.y * displayScale.y);

        var width;
        if (parentSize.width >= canvasBounds.width)
        {
            width = baseSize.width;
        }
        else
        {
            width = baseSize.width - (canvasBounds.width - parentSize.width) * displayScale.x;
        }

        var height;
        if (parentSize.height >= canvasBounds.height)
        {
            height = baseSize.height;
        }
        else
        {
            height = baseSize.height - (canvasBounds.height - parentSize.height) * displayScale.y;
        }

        out.setTo(x, y, width, height);

        if (camera)
        {
            out.width /= camera.zoomX;
            out.height /= camera.zoomY;
            out.centerX = camera.centerX + camera.scrollX;
            out.centerY = camera.centerY + camera.scrollY;
        }

        return out;
    },

    step: function (time, delta)
    {
        if (!this.parent)
        {
            return;
        }

        this._lastCheck += delta;

        if (this.dirty || this._lastCheck > this.resizeInterval)
        {

            if (this.getParentBounds())
            {
                this.refresh();
            }

            this.dirty = false;
            this._lastCheck = 0;
        }
    },

    stopListeners: function ()
    {
        var listeners = this.domlisteners;

        if (screen.orientation && screen.orientation.addEventListener)
        {
            screen.orientation.removeEventListener('change', listeners.orientationChange, false);
        }
        else
        {
            window.removeEventListener('orientationchange', listeners.orientationChange, false);
        }

        window.removeEventListener('resize', listeners.windowResize, false);

        var vendors = [ 'webkit', 'moz', '' ];

        vendors.forEach(function (prefix)
        {
            document.removeEventListener(prefix + 'fullscreenchange', listeners.fullScreenChange, false);
            document.removeEventListener(prefix + 'fullscreenerror', listeners.fullScreenError, false);
        });

        document.removeEventListener('MSFullscreenChange', listeners.fullScreenChange, false);
        document.removeEventListener('MSFullscreenError', listeners.fullScreenError, false);
    },

    destroy: function ()
    {
        this.removeAllListeners();

        this.stopListeners();

        this.game = null;
        this.canvas = null;
        this.canvasBounds = null;
        this.parent = null;
        this.fullscreenTarget = null;

        this.parentSize.destroy();
        this.gameSize.destroy();
        this.baseSize.destroy();
        this.displaySize.destroy();
    },

    isFullscreen: {

        get: function ()
        {
            return this.fullscreen.active;
        }

    },

    width: {

        get: function ()
        {
            return this.gameSize.width;
        }

    },

    height: {

        get: function ()
        {
            return this.gameSize.height;
        }

    },

    isPortrait: {

        get: function ()
        {
            return (this.orientation === CONST.ORIENTATION.PORTRAIT);
        }

    },

    isLandscape: {

        get: function ()
        {
            return (this.orientation === CONST.ORIENTATION.LANDSCAPE);
        }

    },

    isGamePortrait: {

        get: function ()
        {
            return (this.height > this.width);
        }

    },

    isGameLandscape: {

        get: function ()
        {
            return (this.width > this.height);
        }

    }

});

module.exports = ScaleManager;
