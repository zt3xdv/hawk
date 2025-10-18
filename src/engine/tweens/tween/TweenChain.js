var ArrayRemove = require('../../utils/array/Remove');
var BaseTween = require('./BaseTween');
var Class = require('../../utils/Class');
var Events = require('../events');
var GameObjectCreator = require('../../gameobjects/GameObjectCreator');
var GameObjectFactory = require('../../gameobjects/GameObjectFactory');
var TWEEN_CONST = require('./const');

var TweenChain = new Class({

    Extends: BaseTween,

    initialize:

    function TweenChain (parent)
    {
        BaseTween.call(this, parent);

        this.currentTween = null;

        this.currentIndex = 0;
    },

    init: function ()
    {
        this.loopCounter = (this.loop === -1) ? TWEEN_CONST.MAX : this.loop;

        this.setCurrentTween(0);

        if (this.startDelay > 0 && !this.isStartDelayed())
        {
            this.setStartDelayState();
        }
        else
        {
            this.setActiveState();
        }

        return this;
    },

    add: function (tweens)
    {
        var newTweens = this.parent.create(tweens);

        if (!Array.isArray(newTweens))
        {
            newTweens = [ newTweens ];
        }

        var data = this.data;

        for (var i = 0; i < newTweens.length; i++)
        {
            var tween = newTweens[i];

            tween.parent = this;

            data.push(tween.reset());
        }

        this.totalData = data.length;

        return this;
    },

    remove: function (tween)
    {

        ArrayRemove(this.data, tween);

        tween.setRemovedState();

        if (tween === this.currentTween)
        {
            this.nextTween();
        }

        this.totalData = this.data.length;

        return this;
    },

    hasTarget: function (target)
    {
        var data = this.data;

        for (var i = 0; i < this.totalData; i++)
        {
            if (data[i].hasTarget(target))
            {
                return true;
            }
        }

        return false;
    },

    restart: function ()
    {
        if (this.isDestroyed())
        {
            console.warn('Cannot restart destroyed TweenChain', this);

            return this;
        }

        if (this.isRemoved())
        {
            this.parent.makeActive(this);
        }

        this.resetTweens();

        this.paused = false;

        return this.init();
    },

    reset: function (tween)
    {
        tween.seek();

        tween.setActiveState();

        return this;
    },

    makeActive: function (tween)
    {
        tween.reset();

        tween.setActiveState();

        return this;
    },

    nextState: function ()
    {
        if (this.loopCounter > 0)
        {
            this.loopCounter--;

            this.resetTweens();

            if (this.loopDelay > 0)
            {
                this.countdown = this.loopDelay;

                this.setLoopDelayState();
            }
            else
            {
                this.setActiveState();

                this.dispatchEvent(Events.TWEEN_LOOP, 'onLoop');
            }
        }
        else if (this.completeDelay > 0)
        {
            this.countdown = this.completeDelay;

            this.setCompleteDelayState();
        }
        else
        {
            this.onCompleteHandler();

            return true;
        }

        return false;
    },

    play: function ()
    {
        if (this.isDestroyed())
        {
            console.warn('Cannot play destroyed TweenChain', this);

            return this;
        }

        if (this.isPendingRemove() || this.isPending())
        {
            this.resetTweens();
        }

        this.paused = false;

        if (this.startDelay > 0 && !this.isStartDelayed())
        {
            this.setStartDelayState();
        }
        else
        {
            this.setActiveState();
        }

        return this;
    },

    resetTweens: function ()
    {
        var data = this.data;
        var total = this.totalData;

        for (var i = 0; i < total; i++)
        {
            data[i].reset(false);
        }

        this.setCurrentTween(0);
    },

    update: function (delta)
    {
        if (this.isPendingRemove() || this.isDestroyed())
        {
            if (this.persist)
            {
                this.setFinishedState();

                return false;
            }

            return true;
        }
        else if (this.isFinished() || this.paused)
        {
            return false;
        }

        delta *= this.parent.timeScale;

        if (this.isLoopDelayed())
        {
            this.updateLoopCountdown(delta);

            return false;
        }
        else if (this.isCompleteDelayed())
        {
            this.updateCompleteDelay(delta);

            return false;
        }
        else if (!this.hasStarted)
        {
            this.startDelay -= delta;

            if (this.startDelay <= 0)
            {
                this.hasStarted = true;

                this.dispatchEvent(Events.TWEEN_START, 'onStart');

                delta = 0;
            }
        }

        var remove = false;

        if (this.isActive() && this.currentTween)
        {
            if (this.currentTween.update(delta))
            {

                if (this.nextTween())
                {
                    this.nextState();
                }
            }

            remove = this.isPendingRemove();

            if (remove && this.persist)
            {
                this.setFinishedState();

                remove = false;
            }
        }

        return remove;
    },

    nextTween: function ()
    {
        this.currentIndex++;

        if (this.currentIndex === this.totalData)
        {
            return true;
        }
        else
        {
            this.setCurrentTween(this.currentIndex);
        }

        return false;
    },

    setCurrentTween: function (index)
    {
        this.currentIndex = index;

        this.currentTween = this.data[index];

        this.currentTween.setActiveState();
    },

    dispatchEvent: function (event, callback)
    {
        this.emit(event, this);

        var handler = this.callbacks[callback];

        if (handler)
        {
            handler.func.apply(this.callbackScope, [ this ].concat(handler.params));
        }
    },

    destroy: function ()
    {
        BaseTween.prototype.destroy.call(this);

        this.currentTween = null;
    }

});

GameObjectFactory.register('tweenchain', function (config)
{
    return this.scene.sys.tweens.chain(config);
});

GameObjectCreator.register('tweenchain', function (config)
{
    return this.scene.sys.tweens.create(config);
});

module.exports = TweenChain;
