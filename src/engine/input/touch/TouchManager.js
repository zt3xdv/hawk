var Class = require('../../utils/Class');
var InputEvents = require('../events');
var NOOP = require('../../utils/NOOP');

var TouchManager = new Class({

    initialize:

    function TouchManager (inputManager)
    {

        this.manager = inputManager;

        this.capture = true;

        this.enabled = false;

        this.target;

        this.onTouchStart = NOOP;

        this.onTouchStartWindow = NOOP;

        this.onTouchMove = NOOP;

        this.onTouchEnd = NOOP;

        this.onTouchEndWindow = NOOP;

        this.onTouchCancel = NOOP;

        this.onTouchCancelWindow = NOOP;

        this.isTop = true;

        inputManager.events.once(InputEvents.MANAGER_BOOT, this.boot, this);
    },

    boot: function ()
    {
        var config = this.manager.config;

        this.enabled = config.inputTouch;
        this.target = config.inputTouchEventTarget;
        this.capture = config.inputTouchCapture;

        if (!this.target)
        {
            this.target = this.manager.game.canvas;
        }
        else if (typeof this.target === 'string')
        {
            this.target = document.getElementById(this.target);
        }

        if (config.disableContextMenu)
        {
            this.disableContextMenu();
        }

        if (this.enabled && this.target)
        {
            this.startListeners();
        }
    },

    disableContextMenu: function ()
    {
        this.target.addEventListener('contextmenu', function (event)
        {
            event.preventDefault();
            return false;
        });

        return this;
    },

    startListeners: function ()
    {
        var target = this.target;

        if (!target)
        {
            return;
        }

        var _this = this;
        var manager = this.manager;
        var canvas = manager.canvas;
        var autoFocus = (window && window.focus && manager.game.config.autoFocus);

        this.onTouchMove = function (event)
        {
            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled)
            {
                manager.onTouchMove(event);

                if (_this.capture && event.cancelable)
                {
                    event.preventDefault();
                }
            }
        };

        this.onTouchStart = function (event)
        {
            if (autoFocus)
            {
                window.focus();
            }

            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled)
            {
                manager.onTouchStart(event);

                if (_this.capture && event.cancelable && event.target === canvas)
                {
                    event.preventDefault();
                }
            }
        };

        this.onTouchStartWindow = function (event)
        {
            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled && event.target !== canvas)
            {

                manager.onTouchStart(event);
            }
        };

        this.onTouchEnd = function (event)
        {
            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled)
            {
                manager.onTouchEnd(event);

                if (_this.capture && event.cancelable && event.target === canvas)
                {
                    event.preventDefault();
                }
            }
        };

        this.onTouchEndWindow = function (event)
        {
            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled && event.target !== canvas)
            {

                manager.onTouchEnd(event);
            }
        };

        this.onTouchCancel = function (event)
        {
            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled)
            {
                manager.onTouchCancel(event);

                if (_this.capture)
                {
                    event.preventDefault();
                }
            }
        };

        this.onTouchCancelWindow = function (event)
        {
            if (!event.defaultPrevented && _this.enabled && manager && manager.enabled)
            {
                manager.onTouchCancel(event);
            }
        };

        var capture = this.capture;
        var passive = { passive: true };
        var nonPassive = { passive: false };

        target.addEventListener('touchstart', this.onTouchStart, (capture) ? nonPassive : passive);
        target.addEventListener('touchmove', this.onTouchMove, (capture) ? nonPassive : passive);
        target.addEventListener('touchend', this.onTouchEnd, (capture) ? nonPassive : passive);
        target.addEventListener('touchcancel', this.onTouchCancel, (capture) ? nonPassive : passive);

        if (window && manager.game.config.inputWindowEvents)
        {
            try
            {
                window.top.addEventListener('touchstart', this.onTouchStartWindow, nonPassive);
                window.top.addEventListener('touchend', this.onTouchEndWindow, nonPassive);
                window.top.addEventListener('touchcancel', this.onTouchCancelWindow, nonPassive);
            }
            catch (exception)
            {
                window.addEventListener('touchstart', this.onTouchStartWindow, nonPassive);
                window.addEventListener('touchend', this.onTouchEndWindow, nonPassive);
                window.addEventListener('touchcancel', this.onTouchCancelWindow, nonPassive);

                this.isTop = false;
            }
        }

        this.enabled = true;
    },

    stopListeners: function ()
    {
        var target = this.target;

        target.removeEventListener('touchstart', this.onTouchStart);
        target.removeEventListener('touchmove', this.onTouchMove);
        target.removeEventListener('touchend', this.onTouchEnd);
        target.removeEventListener('touchcancel', this.onTouchCancel);

        if (window)
        {
            target = (this.isTop) ? window.top : window;

            target.removeEventListener('touchstart', this.onTouchStartWindow);
            target.removeEventListener('touchend', this.onTouchEndWindow);
            target.removeEventListener('touchcancel', this.onTouchCancelWindow);
        }
    },

    destroy: function ()
    {
        this.stopListeners();

        this.target = null;
        this.enabled = false;
        this.manager = null;
    }

});

module.exports = TouchManager;
