var Animation = require('./Animation');
var Between = require('../math/Between');
var Class = require('../utils/Class');
var CustomMap = require('../structs/Map');
var Events = require('./events');
var GetFastValue = require('../utils/object/GetFastValue');

var AnimationState = new Class({

    initialize:

    function AnimationState (parent)
    {

        this.parent = parent;

        this.animationManager = parent.scene.sys.anims;

        this.animationManager.on(Events.REMOVE_ANIMATION, this.globalRemove, this);

        this.textureManager = this.animationManager.textureManager;

        this.anims = null;

        this.isPlaying = false;

        this.hasStarted = false;

        this.currentAnim = null;

        this.currentFrame = null;

        this.nextAnim = null;

        this.nextAnimsQueue = [];

        this.timeScale = 1;

        this.frameRate = 0;

        this.duration = 0;

        this.msPerFrame = 0;

        this.skipMissedFrames = true;

        this.randomFrame = false;

        this.delay = 0;

        this.repeat = 0;

        this.repeatDelay = 0;

        this.yoyo = false;

        this.showBeforeDelay = false;

        this.showOnStart = false;

        this.hideOnComplete = false;

        this.forward = true;

        this.inReverse = false;

        this.accumulator = 0;

        this.nextTick = 0;

        this.delayCounter = 0;

        this.repeatCounter = 0;

        this.pendingRepeat = false;

        this._paused = false;

        this._wasPlaying = false;

        this._pendingStop = 0;

        this._pendingStopValue;
    },

    chain: function (key)
    {
        var parent = this.parent;

        if (key === undefined)
        {
            this.nextAnimsQueue.length = 0;
            this.nextAnim = null;

            return parent;
        }

        if (!Array.isArray(key))
        {
            key = [ key ];
        }

        for (var i = 0; i < key.length; i++)
        {
            var anim = key[i];

            if (!this.nextAnim)
            {
                this.nextAnim = anim;
            }
            else
            {
                this.nextAnimsQueue.push(anim);
            }
        }

        return this.parent;
    },

    getName: function ()
    {
        return (this.currentAnim) ? this.currentAnim.key : '';
    },

    getFrameName: function ()
    {
        return (this.currentFrame) ? this.currentFrame.textureFrame : '';
    },

    load: function (key)
    {
        if (this.isPlaying)
        {
            this.stop();
        }

        var manager = this.animationManager;
        var animKey = (typeof key === 'string') ? key : GetFastValue(key, 'key', null);

        var anim = (this.exists(animKey)) ? this.get(animKey) : manager.get(animKey);

        if (!anim)
        {
            console.warn('Missing animation: ' + animKey);
        }
        else
        {
            this.currentAnim = anim;

            var totalFrames = anim.getTotalFrames();
            var frameRate = GetFastValue(key, 'frameRate', anim.frameRate);
            var duration = GetFastValue(key, 'duration', anim.duration);

            anim.calculateDuration(this, totalFrames, duration, frameRate);

            this.delay = GetFastValue(key, 'delay', anim.delay);
            this.repeat = GetFastValue(key, 'repeat', anim.repeat);
            this.repeatDelay = GetFastValue(key, 'repeatDelay', anim.repeatDelay);
            this.yoyo = GetFastValue(key, 'yoyo', anim.yoyo);
            this.showBeforeDelay = GetFastValue(key, 'showBeforeDelay', anim.showBeforeDelay);
            this.showOnStart = GetFastValue(key, 'showOnStart', anim.showOnStart);
            this.hideOnComplete = GetFastValue(key, 'hideOnComplete', anim.hideOnComplete);
            this.skipMissedFrames = GetFastValue(key, 'skipMissedFrames', anim.skipMissedFrames);
            this.randomFrame = GetFastValue(key, 'randomFrame', anim.randomFrame);

            this.timeScale = GetFastValue(key, 'timeScale', this.timeScale);

            var startFrame = GetFastValue(key, 'startFrame', 0);

            if (startFrame > totalFrames)
            {
                startFrame = 0;
            }

            if (this.randomFrame)
            {
                startFrame = Between(0, totalFrames - 1);
            }

            var frame = anim.frames[startFrame];

            if (startFrame === 0 && !this.forward)
            {
                frame = anim.getLastFrame();
            }

            this.currentFrame = frame;
        }

        return this.parent;
    },

    pause: function (atFrame)
    {
        if (!this._paused)
        {
            this._paused = true;
            this._wasPlaying = this.isPlaying;
            this.isPlaying = false;
        }

        if (atFrame !== undefined)
        {
            this.setCurrentFrame(atFrame);
        }

        return this.parent;
    },

    resume: function (fromFrame)
    {
        if (this._paused)
        {
            this._paused = false;
            this.isPlaying = this._wasPlaying;
        }

        if (fromFrame !== undefined)
        {
            this.setCurrentFrame(fromFrame);
        }

        return this.parent;
    },

    playAfterDelay: function (key, delay)
    {
        if (!this.isPlaying)
        {
            this.delayCounter = delay;

            this.play(key, true);
        }
        else
        {

            var nextAnim = this.nextAnim;
            var queue = this.nextAnimsQueue;

            if (nextAnim)
            {
                queue.unshift(nextAnim);
            }

            this.nextAnim = key;

            this._pendingStop = 1;
            this._pendingStopValue = delay;
        }

        return this.parent;
    },

    playAfterRepeat: function (key, repeatCount)
    {
        if (repeatCount === undefined) { repeatCount = 1; }

        if (!this.isPlaying)
        {
            this.play(key);
        }
        else
        {

            var nextAnim = this.nextAnim;
            var queue = this.nextAnimsQueue;

            if (nextAnim)
            {
                queue.unshift(nextAnim);
            }

            if (this.repeatCounter !== -1 && repeatCount > this.repeatCounter)
            {
                repeatCount = this.repeatCounter;
            }

            this.nextAnim = key;

            this._pendingStop = 2;
            this._pendingStopValue = repeatCount;
        }

        return this.parent;
    },

    play: function (key, ignoreIfPlaying)
    {
        if (ignoreIfPlaying === undefined) { ignoreIfPlaying = false; }

        var currentAnim = this.currentAnim;
        var parent = this.parent;

        var animKey = (typeof key === 'string') ? key : key.key;

        if (ignoreIfPlaying && this.isPlaying && currentAnim.key === animKey)
        {
            return parent;
        }

        if (currentAnim && this.isPlaying)
        {
            var mix = this.animationManager.getMix(currentAnim.key, key);

            if (mix > 0)
            {
                return this.playAfterDelay(key, mix);
            }
        }

        this.forward = true;
        this.inReverse = false;

        this._paused = false;
        this._wasPlaying = true;

        return this.startAnimation(key);
    },

    playReverse: function (key, ignoreIfPlaying)
    {
        if (ignoreIfPlaying === undefined) { ignoreIfPlaying = false; }

        var animKey = (typeof key === 'string') ? key : key.key;

        if (ignoreIfPlaying && this.isPlaying && this.currentAnim.key === animKey)
        {
            return this.parent;
        }

        this.forward = false;
        this.inReverse = true;

        this._paused = false;
        this._wasPlaying = true;

        return this.startAnimation(key);
    },

    startAnimation: function (key)
    {
        this.load(key);

        var anim = this.currentAnim;
        var gameObject = this.parent;

        if (!anim)
        {
            return gameObject;
        }

        this.repeatCounter = (this.repeat === -1) ? Number.MAX_VALUE : this.repeat;

        anim.getFirstTick(this);

        this.isPlaying = true;
        this.pendingRepeat = false;
        this.hasStarted = false;

        this._pendingStop = 0;
        this._pendingStopValue = 0;
        this._paused = false;

        this.delayCounter += this.delay;

        if (this.delayCounter === 0)
        {
            this.handleStart();
        }
        else if (this.showBeforeDelay)
        {

            this.setCurrentFrame(this.currentFrame);
        }

        return gameObject;
    },

    handleStart: function ()
    {
        if (this.showOnStart)
        {
            this.parent.setVisible(true);
        }

        this.setCurrentFrame(this.currentFrame);

        this.hasStarted = true;

        this.emitEvents(Events.ANIMATION_START);
    },

    handleRepeat: function ()
    {
        this.pendingRepeat = false;

        this.emitEvents(Events.ANIMATION_REPEAT);
    },

    handleStop: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        this.emitEvents(Events.ANIMATION_STOP);
    },

    handleComplete: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        if (this.hideOnComplete)
        {
            this.parent.setVisible(false);
        }

        this.emitEvents(Events.ANIMATION_COMPLETE, Events.ANIMATION_COMPLETE_KEY);
    },

    emitEvents: function (event, keyEvent)
    {
        var anim = this.currentAnim;

        if (anim)
        {
            var frame = this.currentFrame;

            var gameObject = this.parent;

            var frameKey = frame.textureFrame;

            gameObject.emit(event, anim, frame, gameObject, frameKey);

            if (keyEvent)
            {
                gameObject.emit(keyEvent + anim.key, anim, frame, gameObject, frameKey);
            }
        }
    },

    reverse: function ()
    {
        if (this.isPlaying)
        {
            this.inReverse = !this.inReverse;

            this.forward = !this.forward;
        }

        return this.parent;
    },

    getProgress: function ()
    {
        var frame = this.currentFrame;

        if (!frame)
        {
            return 0;
        }

        var p = frame.progress;

        if (this.inReverse)
        {
            p *= -1;
        }

        return p;
    },

    setProgress: function (value)
    {
        if (!this.forward)
        {
            value = 1 - value;
        }

        this.setCurrentFrame(this.currentAnim.getFrameByProgress(value));

        return this.parent;
    },

    setRepeat: function (value)
    {
        this.repeatCounter = (value === -1) ? Number.MAX_VALUE : value;

        return this.parent;
    },

    globalRemove: function (key, animation)
    {
        if (animation === undefined) { animation = this.currentAnim; }

        if (this.isPlaying && animation.key === this.currentAnim.key)
        {
            this.stop();

            this.setCurrentFrame(this.currentAnim.frames[0]);
        }
    },

    restart: function (includeDelay, resetRepeats)
    {
        if (includeDelay === undefined) { includeDelay = false; }
        if (resetRepeats === undefined) { resetRepeats = false; }

        var anim = this.currentAnim;
        var gameObject = this.parent;

        if (!anim)
        {
            return gameObject;
        }

        if (resetRepeats)
        {
            this.repeatCounter = (this.repeat === -1) ? Number.MAX_VALUE : this.repeat;
        }

        anim.getFirstTick(this);

        this.emitEvents(Events.ANIMATION_RESTART);

        this.isPlaying = true;
        this.pendingRepeat = false;

        this.hasStarted = !includeDelay;

        this._pendingStop = 0;
        this._pendingStopValue = 0;
        this._paused = false;

        this.setCurrentFrame(anim.frames[0]);

        return this.parent;
    },

    complete: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        if (this.currentAnim)
        {
            this.handleComplete();
        }

        if (this.nextAnim)
        {
            var key = this.nextAnim;

            this.nextAnim = (this.nextAnimsQueue.length > 0) ? this.nextAnimsQueue.shift() : null;

            this.play(key);
        }

        return this.parent;
    },

    stop: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        this.delayCounter = 0;

        if (this.currentAnim)
        {
            this.handleStop();
        }

        if (this.nextAnim)
        {
            var key = this.nextAnim;

            this.nextAnim = this.nextAnimsQueue.shift();

            this.play(key);
        }

        return this.parent;
    },

    stopAfterDelay: function (delay)
    {
        this._pendingStop = 1;
        this._pendingStopValue = delay;

        return this.parent;
    },

    stopAfterRepeat: function (repeatCount)
    {
        if (repeatCount === undefined) { repeatCount = 1; }

        if (this.repeatCounter !== -1 && repeatCount > this.repeatCounter)
        {
            repeatCount = this.repeatCounter;
        }

        this._pendingStop = 2;
        this._pendingStopValue = repeatCount;

        return this.parent;
    },

    stopOnFrame: function (frame)
    {
        this._pendingStop = 3;
        this._pendingStopValue = frame;

        return this.parent;
    },

    getTotalFrames: function ()
    {
        return (this.currentAnim) ? this.currentAnim.getTotalFrames() : 0;
    },

    update: function (time, delta)
    {
        var anim = this.currentAnim;

        if (!this.isPlaying || !anim || anim.paused)
        {
            return;
        }

        this.accumulator += delta * this.timeScale * this.animationManager.globalTimeScale;

        if (this._pendingStop === 1)
        {
            this._pendingStopValue -= delta;

            if (this._pendingStopValue <= 0)
            {
                return this.stop();
            }
        }

        if (!this.hasStarted)
        {
            if (this.accumulator >= this.delayCounter)
            {
                this.accumulator -= this.delayCounter;

                this.handleStart();
            }
        }
        else if (this.accumulator >= this.nextTick)
        {

            if (this.forward)
            {
                anim.nextFrame(this);
            }
            else
            {
                anim.previousFrame(this);
            }

            if (this.isPlaying && this._pendingStop === 0 && this.skipMissedFrames && this.accumulator > this.nextTick)
            {
                var safetyNet = 0;

                do
                {
                    if (this.forward)
                    {
                        anim.nextFrame(this);
                    }
                    else
                    {
                        anim.previousFrame(this);
                    }

                    safetyNet++;

                } while (this.isPlaying && this.accumulator > this.nextTick && safetyNet < 60);
            }
        }
    },

    setCurrentFrame: function (animationFrame)
    {
        var gameObject = this.parent;

        this.currentFrame = animationFrame;

        gameObject.texture = animationFrame.frame.texture;
        gameObject.frame = animationFrame.frame;

        if (gameObject.isCropped)
        {
            gameObject.frame.updateCropUVs(gameObject._crop, gameObject.flipX, gameObject.flipY);
        }

        if (animationFrame.setAlpha)
        {
            gameObject.alpha = animationFrame.alpha;
        }

        gameObject.setSizeToFrame();

        if (gameObject._originComponent)
        {
            if (animationFrame.frame.customPivot)
            {
                gameObject.setOrigin(animationFrame.frame.pivotX, animationFrame.frame.pivotY);
            }
            else
            {
                gameObject.updateDisplayOrigin();
            }
        }

        if (this.isPlaying && this.hasStarted)
        {
            this.emitEvents(Events.ANIMATION_UPDATE);

            if (this._pendingStop === 3 && this._pendingStopValue === animationFrame)
            {
                this.stop();
            }
        }

        return gameObject;
    },

    nextFrame: function ()
    {
        if (this.currentAnim)
        {
            this.currentAnim.nextFrame(this);
        }

        return this.parent;
    },

    previousFrame: function ()
    {
        if (this.currentAnim)
        {
            this.currentAnim.previousFrame(this);
        }

        return this.parent;
    },

    get: function (key)
    {
        return (this.anims) ? this.anims.get(key) : null;
    },

    exists: function (key)
    {
        return (this.anims) ? this.anims.has(key) : false;
    },

    create: function (config)
    {
        var key = config.key;

        var anim = false;

        if (key)
        {
            anim = this.get(key);

            if (!anim)
            {
                anim = new Animation(this, key, config);

                if (!this.anims)
                {
                    this.anims = new CustomMap();
                }

                this.anims.set(key, anim);
            }
            else
            {
                console.warn('Animation key already exists: ' + key);
            }
        }

        return anim;
    },

    createFromAseprite: function (key, tags)
    {
        return this.animationManager.createFromAseprite(key, tags, this.parent);
    },

    generateFrameNames: function (key, config)
    {
        return this.animationManager.generateFrameNames(key, config);
    },

    generateFrameNumbers: function (key, config)
    {
        return this.animationManager.generateFrameNumbers(key, config);
    },

    remove: function (key)
    {
        var anim = this.get(key);

        if (anim)
        {
            if (this.currentAnim === anim)
            {
                this.stop();
            }

            this.anims.delete(key);
        }

        return anim;
    },

    destroy: function ()
    {
        this.animationManager.off(Events.REMOVE_ANIMATION, this.globalRemove, this);

        if (this.anims)
        {
            this.anims.clear();
        }

        this.animationManager = null;
        this.parent = null;
        this.nextAnim = null;
        this.nextAnimsQueue.length = 0;

        this.currentAnim = null;
        this.currentFrame = null;
    },

    isPaused: {

        get: function ()
        {
            return this._paused;
        }

    }

});

module.exports = AnimationState;
