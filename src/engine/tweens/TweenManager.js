var ArrayRemove = require('../utils/array/Remove');
var Class = require('../utils/Class');
var Flatten = require('../utils/array/Flatten');
var NumberTweenBuilder = require('./builders/NumberTweenBuilder');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');
var StaggerBuilder = require('./builders/StaggerBuilder');
var Tween = require('./tween/Tween');
var TweenBuilder = require('./builders/TweenBuilder');
var TweenChain = require('./tween/TweenChain');
var TweenChainBuilder = require('./builders/TweenChainBuilder');

var TweenManager = new Class({

    initialize:

    function TweenManager (scene)
    {

        this.scene = scene;

        this.events = scene.sys.events;

        this.timeScale = 1;

        this.paused = false;

        this.processing = false;

        this.tweens = [];

        this.time = 0;

        this.startTime = 0;

        this.nextTime = 0;

        this.prevTime = 0;

        this.maxLag = 500;

        this.lagSkip = 33;

        this.gap = 1000 / 240;

        this.events.once(SceneEvents.BOOT, this.boot, this);
        this.events.on(SceneEvents.START, this.start, this);
    },

    boot: function ()
    {
        this.events.once(SceneEvents.DESTROY, this.destroy, this);
    },

    start: function ()
    {
        this.timeScale = 1;
        this.paused = false;

        this.startTime = Date.now();
        this.prevTime = this.startTime;
        this.nextTime = this.gap;

        this.events.on(SceneEvents.UPDATE, this.update, this);
        this.events.once(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    create: function (config)
    {
        if (!Array.isArray(config))
        {
            config = [ config ];
        }

        var result = [];

        for (var i = 0; i < config.length; i++)
        {
            var tween = config[i];

            if (tween instanceof Tween || tween instanceof TweenChain)
            {

                result.push(tween);
            }
            else if (Array.isArray(tween.tweens))
            {
                result.push(TweenChainBuilder(this, tween));
            }
            else
            {
                result.push(TweenBuilder(this, tween));
            }
        }

        return (result.length === 1) ? result[0] : result;
    },

    add: function (config)
    {
        var tween = config;
        var tweens = this.tweens;

        if (tween instanceof Tween || tween instanceof TweenChain)
        {
            tweens.push(tween.reset());
        }
        else
        {
            if (Array.isArray(tween.tweens))
            {
                tween = TweenChainBuilder(this, tween);
            }
            else
            {
                tween = TweenBuilder(this, tween);
            }

            tweens.push(tween.reset());
        }

        return tween;
    },

    addMultiple: function (configs)
    {
        var tween;
        var result = [];
        var tweens = this.tweens;

        for (var i = 0; i < configs.length; i++)
        {
            tween = configs[i];

            if (tween instanceof Tween || tween instanceof TweenChain)
            {
                tweens.push(tween.reset());
            }
            else
            {
                if (Array.isArray(tween.tweens))
                {
                    tween = TweenChainBuilder(this, tween);
                }
                else
                {
                    tween = TweenBuilder(this, tween);
                }

                tweens.push(tween.reset());
            }

            result.push(tween);
        }

        return result;
    },

    chain: function (config)
    {
        var chain = TweenChainBuilder(this, config);

        this.tweens.push(chain.init());

        return chain;
    },

    getChainedTweens: function (tween)
    {
        return tween.getChainedTweens();
    },

    has: function (tween)
    {
        return (this.tweens.indexOf(tween) > -1);
    },

    existing: function (tween)
    {
        if (!this.has(tween))
        {
            this.tweens.push(tween.reset());
        }

        return this;
    },

    addCounter: function (config)
    {
        var tween = NumberTweenBuilder(this, config);

        this.tweens.push(tween.reset());

        return tween;
    },

    stagger: function (value, options)
    {
        return StaggerBuilder(value, options);
    },

    setLagSmooth: function (limit, skip)
    {
        if (limit === undefined) { limit = 1 / 1e-8; }
        if (skip === undefined) { skip = 0; }

        this.maxLag = limit;
        this.lagSkip = Math.min(skip, this.maxLag);

        return this;
    },

    setFps: function (fps)
    {
        if (fps === undefined) { fps = 240; }

        this.gap = 1000 / fps;
        this.nextTime = this.time * 1000 + this.gap;

        return this;
    },

    getDelta: function (tick)
    {
        var elapsed = Date.now() - this.prevTime;

        if (elapsed > this.maxLag)
        {
            this.startTime += elapsed - this.lagSkip;
        }

        this.prevTime += elapsed;

        var time = this.prevTime - this.startTime;
        var overlap = time - this.nextTime;
        var delta = time - this.time * 1000;

        if (overlap > 0 || tick)
        {
            time /= 1000;
            this.time = time;
            this.nextTime += overlap + (overlap >= this.gap ? 4 : this.gap - overlap);
        }
        else
        {
            delta = 0;
        }

        return delta;
    },

    tick: function ()
    {
        this.step(true);

        return this;
    },

    update: function ()
    {
        if (!this.paused)
        {
            this.step(false);
        }
    },

    step: function (tick)
    {
        if (tick === undefined) { tick = false; }

        var delta = this.getDelta(tick);

        if (delta <= 0)
        {

            return;
        }

        this.processing = true;

        var i;
        var tween;
        var toDestroy = [];
        var list = this.tweens;

        for (i = 0; i < list.length; i++)
        {
            tween = list[i];

            if (tween.update(delta))
            {
                toDestroy.push(tween);
            }
        }

        var count = toDestroy.length;

        if (count && list.length > 0)
        {
            for (i = 0; i < count; i++)
            {
                tween = toDestroy[i];

                var idx = list.indexOf(tween);

                if (idx > -1 && (tween.isPendingRemove() || tween.isDestroyed()))
                {
                    list.splice(idx, 1);

                    tween.destroy();
                }
            }

            toDestroy.length = 0;
        }

        this.processing = false;
    },

    remove: function (tween)
    {
        if (this.processing)
        {

            tween.setPendingRemoveState();
        }
        else
        {

            ArrayRemove(this.tweens, tween);

            tween.setRemovedState();
        }

        return this;
    },

    reset: function (tween)
    {
        this.existing(tween);

        tween.seek();

        tween.setActiveState();

        return this;
    },

    makeActive: function (tween)
    {
        this.existing(tween);

        tween.setActiveState();

        return this;
    },

    each: function (callback, scope)
    {
        var i;
        var args = [ null ];

        for (i = 1; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }

        this.tweens.forEach(function (tween)
        {
            args[0] = tween;

            callback.apply(scope, args);
        });

        return this;
    },

    getTweens: function ()
    {
        return this.tweens.slice();
    },

    getTweensOf: function (target)
    {
        var output = [];
        var list = this.tweens;

        if (!Array.isArray(target))
        {
            target = [ target ];
        }
        else
        {
            target = Flatten(target);
        }

        var targetLen = target.length;

        for (var i = 0; i < list.length; i++)
        {
            var tween = list[i];

            for (var t = 0; t < targetLen; t++)
            {
                if (!tween.isDestroyed() && tween.hasTarget(target[t]))
                {
                    output.push(tween);
                }
            }
        }

        return output;
    },

    getGlobalTimeScale: function ()
    {
        return this.timeScale;
    },

    setGlobalTimeScale: function (value)
    {
        this.timeScale = value;

        return this;
    },

    isTweening: function (target)
    {
        var list = this.tweens;
        var tween;

        for (var i = 0; i < list.length; i++)
        {
            tween = list[i];

            if (tween.isPlaying() && tween.hasTarget(target))
            {
                return true;
            }
        }

        return false;
    },

    killAll: function ()
    {
        var tweens = (this.processing) ? this.getTweens() : this.tweens;

        for (var i = 0; i < tweens.length; i++)
        {
            tweens[i].destroy();
        }

        if (!this.processing)
        {
            tweens.length = 0;
        }

        return this;
    },

    killTweensOf: function (target)
    {
        var tweens = this.getTweensOf(target);

        for (var i = 0; i < tweens.length; i++)
        {
            tweens[i].destroy();
        }

        return this;
    },

    pauseAll: function ()
    {
        this.paused = true;

        return this;
    },

    resumeAll: function ()
    {
        this.paused = false;

        return this;
    },

    shutdown: function ()
    {
        this.killAll();

        this.tweens = [];

        this.events.off(SceneEvents.UPDATE, this.update, this);
        this.events.off(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    destroy: function ()
    {
        this.shutdown();

        this.events.off(SceneEvents.START, this.start, this);

        this.scene = null;
        this.events = null;
    }

});

PluginCache.register('TweenManager', TweenManager, 'tweens');

module.exports = TweenManager;
