var Class = require('../utils/Class');
var GetValue = require('../utils/object/GetValue');
var NOOP = require('../utils/NOOP');
var RequestAnimationFrame = require('../dom/RequestAnimationFrame');

var TimeStep = new Class({

    initialize:

    function TimeStep (game, config)
    {

        this.game = game;

        this.raf = new RequestAnimationFrame();

        this.started = false;

        this.running = false;

        this.minFps = GetValue(config, 'min', 5);

        this.targetFps = GetValue(config, 'target', 60);

        this.fpsLimit = GetValue(config, 'limit', 0);

        this.hasFpsLimit = (this.fpsLimit > 0);

        this._limitRate = (this.hasFpsLimit) ? (1000 / this.fpsLimit) : 0;

        this._min = 1000 / this.minFps;

        this._target = 1000 / this.targetFps;

        this.actualFps = this.targetFps;

        this.nextFpsUpdate = 0;

        this.framesThisSecond = 0;

        this.callback = NOOP;

        this.forceSetTimeOut = GetValue(config, 'forceSetTimeOut', false);

        this.time = 0;

        this.startTime = 0;

        this.lastTime = 0;

        this.frame = 0;

        this.inFocus = true;

        this.pauseDuration = 0;

        this._pauseTime = 0;

        this._coolDown = 0;

        this.delta = 0;

        this.deltaIndex = 0;

        this.deltaHistory = [];

        this.deltaSmoothingMax = GetValue(config, 'deltaHistory', 10);

        this.panicMax = GetValue(config, 'panicMax', 120);

        this.rawDelta = 0;

        this.now = 0;

        this.smoothStep = GetValue(config, 'smoothStep', true);
    },

    blur: function ()
    {
        this.inFocus = false;
    },

    focus: function ()
    {
        this.inFocus = true;

        this.resetDelta();
    },

    pause: function ()
    {
        this._pauseTime = window.performance.now();
    },

    resume: function ()
    {
        this.resetDelta();

        this.pauseDuration = this.time - this._pauseTime;
        this.startTime += this.pauseDuration;
    },

    resetDelta: function ()
    {
        var now = window.performance.now();

        this.time = now;
        this.lastTime = now;
        this.nextFpsUpdate = now + 1000;
        this.framesThisSecond = 0;

        for (var i = 0; i < this.deltaSmoothingMax; i++)
        {
            this.deltaHistory[i] = Math.min(this._target, this.deltaHistory[i]);
        }

        this.delta = 0;
        this.deltaIndex = 0;

        this._coolDown = this.panicMax;
    },

    start: function (callback)
    {
        if (this.started)
        {
            return this;
        }

        this.started = true;
        this.running = true;

        for (var i = 0; i < this.deltaSmoothingMax; i++)
        {
            this.deltaHistory[i] = this._target;
        }

        this.resetDelta();

        this.startTime = window.performance.now();

        this.callback = callback;

        var step = (this.hasFpsLimit) ? this.stepLimitFPS.bind(this) : this.step.bind(this);

        this.raf.start(step, this.forceSetTimeOut, this._target);
    },

    smoothDelta: function (delta)
    {
        var idx = this.deltaIndex;
        var history = this.deltaHistory;
        var max = this.deltaSmoothingMax;

        if (this._coolDown > 0 || !this.inFocus)
        {
            this._coolDown--;

            delta = Math.min(delta, this._target);
        }

        if (delta > this._min)
        {

            delta = history[idx];

            delta = Math.min(delta, this._min);
        }

        history[idx] = delta;

        this.deltaIndex++;

        if (this.deltaIndex >= max)
        {
            this.deltaIndex = 0;
        }

        var avg = 0;

        for (var i = 0; i < max; i++)
        {
            avg += history[i];
        }

        avg /= max;

        return avg;
    },

    updateFPS: function (time)
    {
        this.actualFps = 0.25 * this.framesThisSecond + 0.75 * this.actualFps;
        this.nextFpsUpdate = time + 1000;
        this.framesThisSecond = 0;
    },

    stepLimitFPS: function (time)
    {
        this.now = time;

        var delta = Math.max(0, time - this.lastTime);

        this.rawDelta = delta;

        this.time += this.rawDelta;

        if (this.smoothStep)
        {
            delta = this.smoothDelta(delta);
        }

        this.delta += delta;

        if (time >= this.nextFpsUpdate)
        {
            this.updateFPS(time);
        }

        this.framesThisSecond++;

        if (this.delta >= this._limitRate)
        {
            this.callback(time, this.delta);

            this.delta = 0;
        }

        this.lastTime = time;

        this.frame++;
    },

    step: function (time)
    {
        this.now = time;

        var delta = Math.max(0, time - this.lastTime);

        this.rawDelta = delta;

        this.time += this.rawDelta;

        if (this.smoothStep)
        {
            delta = this.smoothDelta(delta);
        }

        this.delta = delta;

        if (time >= this.nextFpsUpdate)
        {
            this.updateFPS(time);
        }

        this.framesThisSecond++;

        this.callback(time, delta);

        this.lastTime = time;

        this.frame++;
    },

    tick: function ()
    {
        var now = window.performance.now();

        if (this.hasFpsLimit)
        {
            this.stepLimitFPS(now);
        }
        else
        {
            this.step(now);
        }
    },

    sleep: function ()
    {
        if (this.running)
        {
            this.raf.stop();

            this.running = false;
        }
    },

    wake: function (seamless)
    {
        if (seamless === undefined) { seamless = false; }

        var now = window.performance.now();

        if (this.running)
        {
            return;
        }
        else if (seamless)
        {
            this.startTime += -this.lastTime + (this.lastTime + now);
        }

        var step = (this.hasFpsLimit) ? this.stepLimitFPS.bind(this) : this.step.bind(this);

        this.raf.start(step, this.forceSetTimeOut, this._target);

        this.running = true;

        this.nextFpsUpdate = now + 1000;
        this.framesThisSecond = 0;
        this.fpsLimitTriggered = false;

        this.tick();
    },

    getDuration: function ()
    {
        return Math.round(this.lastTime - this.startTime) / 1000;
    },

    getDurationMS: function ()
    {
        return Math.round(this.lastTime - this.startTime);
    },

    stop: function ()
    {
        this.running = false;
        this.started = false;

        this.raf.stop();

        return this;
    },

    destroy: function ()
    {
        this.stop();

        this.raf.destroy();

        this.raf = null;
        this.game = null;
        this.callback = null;
    }

});

module.exports = TimeStep;
