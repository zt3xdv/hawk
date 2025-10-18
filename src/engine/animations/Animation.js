var Clamp = require('../math/Clamp');
var Class = require('../utils/Class');
var Events = require('./events');
var FindClosestInSorted = require('../utils/array/FindClosestInSorted');
var Frame = require('./AnimationFrame');
var GetValue = require('../utils/object/GetValue');
var SortByDigits = require('../utils/array/SortByDigits');

var Animation = new Class({

    initialize:

    function Animation (manager, key, config)
    {

        this.manager = manager;

        this.key = key;

        this.type = 'frame';

        this.frames = this.getFrames(
            manager.textureManager,
            GetValue(config, 'frames', []),
            GetValue(config, 'defaultTextureKey', null),
            GetValue(config, 'sortFrames', true)
        );

        this.frameRate = GetValue(config, 'frameRate', null);

        this.duration = GetValue(config, 'duration', null);

        this.msPerFrame;

        this.skipMissedFrames = GetValue(config, 'skipMissedFrames', true);

        this.delay = GetValue(config, 'delay', 0);

        this.repeat = GetValue(config, 'repeat', 0);

        this.repeatDelay = GetValue(config, 'repeatDelay', 0);

        this.yoyo = GetValue(config, 'yoyo', false);

        this.showBeforeDelay = GetValue(config, 'showBeforeDelay', false);

        this.showOnStart = GetValue(config, 'showOnStart', false);

        this.hideOnComplete = GetValue(config, 'hideOnComplete', false);

        this.randomFrame = GetValue(config, 'randomFrame', false);

        this.paused = false;

        this.calculateDuration(this, this.getTotalFrames(), this.duration, this.frameRate);

        if (this.manager.on)
        {
            this.manager.on(Events.PAUSE_ALL, this.pause, this);
            this.manager.on(Events.RESUME_ALL, this.resume, this);
        }
    },

    getTotalFrames: function ()
    {
        return this.frames.length;
    },

    calculateDuration: function (target, totalFrames, duration, frameRate)
    {
        if (duration === null && frameRate === null)
        {

            target.frameRate = 24;
            target.duration = (24 / totalFrames) * 1000;
        }
        else if (duration && frameRate === null)
        {

            target.duration = duration;
            target.frameRate = totalFrames / (duration / 1000);
        }
        else
        {

            target.frameRate = frameRate;
            target.duration = (totalFrames / frameRate) * 1000;
        }

        target.msPerFrame = 1000 / target.frameRate;
    },

    addFrame: function (config)
    {
        return this.addFrameAt(this.frames.length, config);
    },

    addFrameAt: function (index, config)
    {
        var newFrames = this.getFrames(this.manager.textureManager, config);

        if (newFrames.length > 0)
        {
            if (index === 0)
            {
                this.frames = newFrames.concat(this.frames);
            }
            else if (index === this.frames.length)
            {
                this.frames = this.frames.concat(newFrames);
            }
            else
            {
                var pre = this.frames.slice(0, index);
                var post = this.frames.slice(index);

                this.frames = pre.concat(newFrames, post);
            }

            this.updateFrameSequence();
        }

        return this;
    },

    checkFrame: function (index)
    {
        return (index >= 0 && index < this.frames.length);
    },

    getFirstTick: function (state)
    {

        state.accumulator = 0;

        state.nextTick = state.frameRate === state.currentAnim.frameRate ? state.currentFrame.duration || state.msPerFrame : state.msPerFrame;
    },

    getFrameAt: function (index)
    {
        return this.frames[index];
    },

    getFrames: function (textureManager, frames, defaultTextureKey, sortFrames)
    {
        if (sortFrames === undefined) { sortFrames = true; }

        var out = [];
        var prev;
        var animationFrame;
        var index = 1;
        var i;
        var textureKey;

        if (typeof frames === 'string')
        {
            textureKey = frames;

            if (!textureManager.exists(textureKey))
            {
                console.warn('Texture "%s" not found', textureKey);

                return out;
            }

            var texture = textureManager.get(textureKey);
            var frameKeys = texture.getFrameNames();

            if (sortFrames)
            {
                SortByDigits(frameKeys);
            }

            frames = [];

            frameKeys.forEach(function (value)
            {
                frames.push({ key: textureKey, frame: value });
            });
        }

        if (!Array.isArray(frames) || frames.length === 0)
        {
            return out;
        }

        for (i = 0; i < frames.length; i++)
        {
            var item = frames[i];

            var key = GetValue(item, 'key', defaultTextureKey);

            if (!key)
            {
                continue;
            }

            var frame = GetValue(item, 'frame', 0);

            var textureFrame = textureManager.getFrame(key, frame);

            if (!textureFrame)
            {
                console.warn('Texture "%s" not found', key);

                continue;
            }

            animationFrame = new Frame(key, frame, index, textureFrame);

            animationFrame.duration = GetValue(item, 'duration', 0);

            animationFrame.isFirst = (!prev);

            if (prev)
            {
                prev.nextFrame = animationFrame;

                animationFrame.prevFrame = prev;
            }

            out.push(animationFrame);

            prev = animationFrame;

            index++;
        }

        if (out.length > 0)
        {
            animationFrame.isLast = true;

            animationFrame.nextFrame = out[0];

            out[0].prevFrame = animationFrame;

            var slice = 1 / (out.length - 1);

            for (i = 0; i < out.length; i++)
            {
                out[i].progress = i * slice;
            }
        }

        return out;
    },

    getNextTick: function (state)
    {
        state.accumulator -= state.nextTick;

        state.nextTick = state.frameRate === state.currentAnim.frameRate ? state.currentFrame.duration || state.msPerFrame : state.msPerFrame;
    },

    getFrameByProgress: function (value)
    {
        value = Clamp(value, 0, 1);

        return FindClosestInSorted(value, this.frames, 'progress');
    },

    nextFrame: function (state)
    {
        var frame = state.currentFrame;

        if (frame.isLast)
        {

            if (state.yoyo)
            {
                this.handleYoyoFrame(state, false);
            }
            else if (state.repeatCounter > 0)
            {

                if (state.inReverse && state.forward)
                {
                    state.forward = false;
                }
                else
                {
                    this.repeatAnimation(state);
                }
            }
            else
            {
                state.complete();
            }
        }
        else
        {
            this.updateAndGetNextTick(state, frame.nextFrame);
        }
    },

    handleYoyoFrame: function (state, isReverse)
    {
        if (!isReverse) { isReverse = false; }

        if (state.inReverse === !isReverse && state.repeatCounter > 0)
        {
            if (state.repeatDelay === 0 || state.pendingRepeat)
            {
                state.forward = isReverse;
            }

            this.repeatAnimation(state);

            return;
        }

        if (state.inReverse !== isReverse && state.repeatCounter === 0)
        {
            state.complete();

            return;
        }

        state.forward = isReverse;

        var frame = (isReverse) ? state.currentFrame.nextFrame : state.currentFrame.prevFrame;

        this.updateAndGetNextTick(state, frame);
    },

    getLastFrame: function ()
    {
        return this.frames[this.frames.length - 1];
    },

    previousFrame: function (state)
    {
        var frame = state.currentFrame;

        if (frame.isFirst)
        {

            if (state.yoyo)
            {
                this.handleYoyoFrame(state, true);
            }
            else if (state.repeatCounter > 0)
            {
                if (state.inReverse && !state.forward)
                {
                    this.repeatAnimation(state);
                }
                else
                {

                    state.forward = true;

                    this.repeatAnimation(state);
                }
            }
            else
            {
                state.complete();
            }
        }
        else
        {
            this.updateAndGetNextTick(state, frame.prevFrame);
        }
    },

    updateAndGetNextTick: function (state, frame)
    {
        state.setCurrentFrame(frame);

        this.getNextTick(state);
    },

    removeFrame: function (frame)
    {
        var index = this.frames.indexOf(frame);

        if (index !== -1)
        {
            this.removeFrameAt(index);
        }

        return this;
    },

    removeFrameAt: function (index)
    {
        this.frames.splice(index, 1);

        this.updateFrameSequence();

        return this;
    },

    repeatAnimation: function (state)
    {
        if (state._pendingStop === 2)
        {
            if (state._pendingStopValue === 0)
            {
                return state.stop();
            }
            else
            {
                state._pendingStopValue--;
            }
        }

        if (state.repeatDelay > 0 && !state.pendingRepeat)
        {
            state.pendingRepeat = true;
            state.accumulator -= state.nextTick;
            state.nextTick += state.repeatDelay;
        }
        else
        {
            state.repeatCounter--;

            if (state.forward)
            {
                state.setCurrentFrame(state.currentFrame.nextFrame);
            }
            else
            {
                state.setCurrentFrame(state.currentFrame.prevFrame);
            }

            if (state.isPlaying)
            {
                this.getNextTick(state);

                state.handleRepeat();
            }
        }
    },

    toJSON: function ()
    {
        var output = {
            key: this.key,
            type: this.type,
            frames: [],
            frameRate: this.frameRate,
            duration: this.duration,
            skipMissedFrames: this.skipMissedFrames,
            delay: this.delay,
            repeat: this.repeat,
            repeatDelay: this.repeatDelay,
            yoyo: this.yoyo,
            showBeforeDelay: this.showBeforeDelay,
            showOnStart: this.showOnStart,
            randomFrame: this.randomFrame,
            hideOnComplete: this.hideOnComplete
        };

        this.frames.forEach(function (frame)
        {
            output.frames.push(frame.toJSON());
        });

        return output;
    },

    updateFrameSequence: function ()
    {
        var len = this.frames.length;
        var slice = 1 / (len - 1);

        var frame;

        for (var i = 0; i < len; i++)
        {
            frame = this.frames[i];

            frame.index = i + 1;
            frame.isFirst = false;
            frame.isLast = false;
            frame.progress = i * slice;

            if (i === 0)
            {
                frame.isFirst = true;

                if (len === 1)
                {
                    frame.isLast = true;
                    frame.nextFrame = frame;
                    frame.prevFrame = frame;
                }
                else
                {
                    frame.isLast = false;
                    frame.prevFrame = this.frames[len - 1];
                    frame.nextFrame = this.frames[i + 1];
                }
            }
            else if (i === len - 1 && len > 1)
            {
                frame.isLast = true;
                frame.prevFrame = this.frames[len - 2];
                frame.nextFrame = this.frames[0];
            }
            else if (len > 1)
            {
                frame.prevFrame = this.frames[i - 1];
                frame.nextFrame = this.frames[i + 1];
            }
        }

        return this;
    },

    pause: function ()
    {
        this.paused = true;

        return this;
    },

    resume: function ()
    {
        this.paused = false;

        return this;
    },

    destroy: function ()
    {
        if (this.manager.off)
        {
            this.manager.off(Events.PAUSE_ALL, this.pause, this);
            this.manager.off(Events.RESUME_ALL, this.resume, this);
        }

        this.manager.remove(this.key);

        for (var i = 0; i < this.frames.length; i++)
        {
            this.frames[i].destroy();
        }

        this.frames = [];

        this.manager = null;
    }

});

module.exports = Animation;
