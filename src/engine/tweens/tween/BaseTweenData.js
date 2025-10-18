var Class = require('../../utils/Class');
var Events = require('../events');
var TWEEN_CONST = require('./const');

var BaseTweenData = new Class({

    initialize:

    function BaseTweenData (tween, targetIndex, delay, duration, yoyo, hold, repeat, repeatDelay, flipX, flipY)
    {

        this.tween = tween;

        this.targetIndex = targetIndex;

        this.duration = (duration <= 0) ? 0.01 : duration;

        this.totalDuration = 0;

        this.delay = 0;

        this.getDelay = delay;

        this.yoyo = yoyo;

        this.hold = hold;

        this.repeat = repeat;

        this.repeatDelay = repeatDelay;

        this.repeatCounter = 0;

        this.flipX = flipX;

        this.flipY = flipY;

        this.progress = 0;

        this.elapsed = 0;

        this.state = 0;

        this.isCountdown = false;
    },

    getTarget: function ()
    {
        return this.tween.targets[this.targetIndex];
    },

    setTargetValue: function (value)
    {
        if (value === undefined) { value = this.current; }

        this.tween.targets[this.targetIndex][this.key] = value;
    },

    setCreatedState: function ()
    {
        this.state = TWEEN_CONST.CREATED;
        this.isCountdown = false;
    },

    setDelayState: function ()
    {
        this.state = TWEEN_CONST.DELAY;
        this.isCountdown = true;
    },

    setPendingRenderState: function ()
    {
        this.state = TWEEN_CONST.PENDING_RENDER;
        this.isCountdown = false;
    },

    setPlayingForwardState: function ()
    {
        this.state = TWEEN_CONST.PLAYING_FORWARD;
        this.isCountdown = false;
    },

    setPlayingBackwardState: function ()
    {
        this.state = TWEEN_CONST.PLAYING_BACKWARD;
        this.isCountdown = false;
    },

    setHoldState: function ()
    {
        this.state = TWEEN_CONST.HOLD_DELAY;
        this.isCountdown = true;
    },

    setRepeatState: function ()
    {
        this.state = TWEEN_CONST.REPEAT_DELAY;
        this.isCountdown = true;
    },

    setCompleteState: function ()
    {
        this.state = TWEEN_CONST.COMPLETE;
        this.isCountdown = false;
    },

    isCreated: function ()
    {
        return (this.state === TWEEN_CONST.CREATED);
    },

    isDelayed: function ()
    {
        return (this.state === TWEEN_CONST.DELAY);
    },

    isPendingRender: function ()
    {
        return (this.state === TWEEN_CONST.PENDING_RENDER);
    },

    isPlayingForward: function ()
    {
        return (this.state === TWEEN_CONST.PLAYING_FORWARD);
    },

    isPlayingBackward: function ()
    {
        return (this.state === TWEEN_CONST.PLAYING_BACKWARD);
    },

    isHolding: function ()
    {
        return (this.state === TWEEN_CONST.HOLD_DELAY);
    },

    isRepeating: function ()
    {
        return (this.state === TWEEN_CONST.REPEAT_DELAY);
    },

    isComplete: function ()
    {
        return (this.state === TWEEN_CONST.COMPLETE);
    },

    setStateFromEnd: function (diff)
    {
        if (this.yoyo)
        {
            this.onRepeat(diff, true, true);
        }
        else if (this.repeatCounter > 0)
        {
            this.onRepeat(diff, true, false);
        }
        else
        {
            this.setCompleteState();
        }
    },

    setStateFromStart: function (diff)
    {
        if (this.repeatCounter > 0)
        {
            this.onRepeat(diff, false);
        }
        else
        {
            this.setCompleteState();
        }
    },

    reset: function ()
    {
        var tween = this.tween;
        var totalTargets = tween.totalTargets;

        var targetIndex = this.targetIndex;
        var target = tween.targets[targetIndex];
        var key = this.key;

        this.progress = 0;
        this.elapsed = 0;

        this.delay = this.getDelay(target, key, 0, targetIndex, totalTargets, tween);

        this.repeatCounter = (this.repeat === -1) ? TWEEN_CONST.MAX : this.repeat;

        this.setPendingRenderState();

        var t1 = this.duration + this.hold;

        if (this.yoyo)
        {
            t1 += this.duration;
        }

        var t2 = t1 + this.repeatDelay;

        this.totalDuration = this.delay + t1;

        if (this.repeat === -1)
        {
            this.totalDuration += (t2 * TWEEN_CONST.MAX);
            tween.isInfinite = true;
        }
        else if (this.repeat > 0)
        {
            this.totalDuration += (t2 * this.repeat);
        }

        if (this.totalDuration > tween.duration)
        {

            tween.duration = this.totalDuration;
        }

        if (this.delay < tween.startDelay)
        {
            tween.startDelay = this.delay;
        }

        if (this.delay > 0)
        {
            this.elapsed = this.delay;

            this.setDelayState();
        }
    },

    onRepeat: function (diff, setStart, isYoyo)
    {
        var tween = this.tween;
        var totalTargets = tween.totalTargets;

        var targetIndex = this.targetIndex;
        var target = tween.targets[targetIndex];
        var key = this.key;

        var isTweenData = (key !== 'texture');

        this.elapsed = diff;
        this.progress = diff / this.duration;

        if (this.flipX)
        {
            target.toggleFlipX();
        }

        if (this.flipY)
        {
            target.toggleFlipY();
        }

        if (isTweenData && (setStart || isYoyo))
        {
            this.start = this.getStartValue(target, key, this.start, targetIndex, totalTargets, tween);
        }

        if (isYoyo)
        {
            this.setPlayingBackwardState();

            this.dispatchEvent(Events.TWEEN_YOYO, 'onYoyo');

            return;
        }

        this.repeatCounter--;

        if (isTweenData)
        {
            this.end = this.getEndValue(target, key, this.start, targetIndex, totalTargets, tween);
        }

        if (this.repeatDelay > 0)
        {
            this.elapsed = this.repeatDelay - diff;

            if (isTweenData)
            {
                this.current = this.start;

                target[key] = this.current;
            }

            this.setRepeatState();
        }
        else
        {
            this.setPlayingForwardState();

            this.dispatchEvent(Events.TWEEN_REPEAT, 'onRepeat');
        }
    },

    destroy: function ()
    {
        this.tween = null;
        this.getDelay = null;
        this.setCompleteState();
    }

});

module.exports = BaseTweenData;
