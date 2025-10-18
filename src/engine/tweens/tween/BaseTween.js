var Class = require('../../utils/Class');
var EventEmitter = require('eventemitter3');
var Events = require('../events');
var TWEEN_CONST = require('./const');

var BaseTween = new Class({

    Extends: EventEmitter,

    initialize:

    function BaseTween (parent)
    {
        EventEmitter.call(this);

        this.parent = parent;

        this.data = [];

        this.totalData = 0;

        this.startDelay = 0;

        this.hasStarted = false;

        this.timeScale = 1;

        this.loop = 0;

        this.loopDelay = 0;

        this.loopCounter = 0;

        this.completeDelay = 0;

        this.countdown = 0;

        this.state = TWEEN_CONST.PENDING;

        this.paused = false;

        this.callbacks = {
            onActive: null,
            onComplete: null,
            onLoop: null,
            onPause: null,
            onRepeat: null,
            onResume: null,
            onStart: null,
            onStop: null,
            onUpdate: null,
            onYoyo: null
        };

        this.callbackScope;

        this.persist = false;
    },

    setTimeScale: function (value)
    {
        this.timeScale = value;

        return this;
    },

    getTimeScale: function ()
    {
        return this.timeScale;
    },

    isPlaying: function ()
    {
        return (!this.paused && this.isActive());
    },

    isPaused: function ()
    {
        return this.paused;
    },

    pause: function ()
    {
        if (!this.paused)
        {
            this.paused = true;

            this.dispatchEvent(Events.TWEEN_PAUSE, 'onPause');
        }

        return this;
    },

    resume: function ()
    {
        if (this.paused)
        {
            this.paused = false;

            this.dispatchEvent(Events.TWEEN_RESUME, 'onResume');
        }

        return this;
    },

    makeActive: function ()
    {
        this.parent.makeActive(this);

        this.dispatchEvent(Events.TWEEN_ACTIVE, 'onActive');
    },

    onCompleteHandler: function ()
    {
        this.setPendingRemoveState();

        this.dispatchEvent(Events.TWEEN_COMPLETE, 'onComplete');
    },

    complete: function (delay)
    {
        if (delay === undefined) { delay = 0; }

        if (delay)
        {
            this.setCompleteDelayState();

            this.countdown = delay;
        }
        else
        {
            this.onCompleteHandler();
        }

        return this;
    },

    completeAfterLoop: function (loops)
    {
        if (loops === undefined) { loops = 0; }

        if (this.loopCounter > loops)
        {
            this.loopCounter = loops;
        }

        return this;
    },

    remove: function ()
    {
        if (this.parent)
        {
            this.parent.remove(this);
        }

        return this;
    },

    stop: function ()
    {
        if (this.parent && !this.isRemoved() && !this.isPendingRemove() && !this.isDestroyed())
        {
            this.dispatchEvent(Events.TWEEN_STOP, 'onStop');

            this.setPendingRemoveState();
        }

        return this;
    },

    updateLoopCountdown: function (delta)
    {
        this.countdown -= delta;

        if (this.countdown <= 0)
        {
            this.setActiveState();

            this.dispatchEvent(Events.TWEEN_LOOP, 'onLoop');
        }
    },

    updateStartCountdown: function (delta)
    {
        this.countdown -= delta;

        if (this.countdown <= 0)
        {
            this.hasStarted = true;

            this.setActiveState();

            this.dispatchEvent(Events.TWEEN_START, 'onStart');

            delta = 0;
        }

        return delta;
    },

    updateCompleteDelay: function (delta)
    {
        this.countdown -= delta;

        if (this.countdown <= 0)
        {
            this.onCompleteHandler();
        }
    },

    setCallback: function (type, callback, params)
    {
        if (params === undefined) { params = []; }

        if (this.callbacks.hasOwnProperty(type))
        {
            this.callbacks[type] = { func: callback, params: params };
        }

        return this;
    },

    setPendingState: function ()
    {
        this.state = TWEEN_CONST.PENDING;
    },

    setActiveState: function ()
    {
        this.state = TWEEN_CONST.ACTIVE;

        this.hasStarted = false;
    },

    setLoopDelayState: function ()
    {
        this.state = TWEEN_CONST.LOOP_DELAY;
    },

    setCompleteDelayState: function ()
    {
        this.state = TWEEN_CONST.COMPLETE_DELAY;
    },

    setStartDelayState: function ()
    {
        this.state = TWEEN_CONST.START_DELAY;

        this.countdown = this.startDelay;

        this.hasStarted = false;
    },

    setPendingRemoveState: function ()
    {
        this.state = TWEEN_CONST.PENDING_REMOVE;
    },

    setRemovedState: function ()
    {
        this.state = TWEEN_CONST.REMOVED;
    },

    setFinishedState: function ()
    {
        this.state = TWEEN_CONST.FINISHED;
    },

    setDestroyedState: function ()
    {
        this.state = TWEEN_CONST.DESTROYED;
    },

    isPending: function ()
    {
        return (this.state === TWEEN_CONST.PENDING);
    },

    isActive: function ()
    {
        return (this.state === TWEEN_CONST.ACTIVE);
    },

    isLoopDelayed: function ()
    {
        return (this.state === TWEEN_CONST.LOOP_DELAY);
    },

    isCompleteDelayed: function ()
    {
        return (this.state === TWEEN_CONST.COMPLETE_DELAY);
    },

    isStartDelayed: function ()
    {
        return (this.state === TWEEN_CONST.START_DELAY);
    },

    isPendingRemove: function ()
    {
        return (this.state === TWEEN_CONST.PENDING_REMOVE);
    },

    isRemoved: function ()
    {
        return (this.state === TWEEN_CONST.REMOVED);
    },

    isFinished: function ()
    {
        return (this.state === TWEEN_CONST.FINISHED);
    },

    isDestroyed: function ()
    {
        return (this.state === TWEEN_CONST.DESTROYED);
    },

    destroy: function ()
    {
        if (this.data)
        {
            this.data.forEach(function (tweenData)
            {
                tweenData.destroy();
            });
        }

        this.removeAllListeners();

        this.callbacks = null;
        this.data = null;
        this.parent = null;

        this.setDestroyedState();
    }

});

BaseTween.TYPES = [
    'onActive',
    'onComplete',
    'onLoop',
    'onPause',
    'onRepeat',
    'onResume',
    'onStart',
    'onStop',
    'onUpdate',
    'onYoyo'
];

module.exports = BaseTween;
