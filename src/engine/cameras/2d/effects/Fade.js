var Clamp = require('../../../math/Clamp');
var Class = require('../../../utils/Class');
var Events = require('../events');

var Fade = new Class({

    initialize:

    function Fade (camera)
    {

        this.camera = camera;

        this.isRunning = false;

        this.isComplete = false;

        this.direction = true;

        this.duration = 0;

        this.red = 0;

        this.green = 0;

        this.blue = 0;

        this.alpha = 0;

        this.progress = 0;

        this._elapsed = 0;

        this._onUpdate;

        this._onUpdateScope;
    },

    start: function (direction, duration, red, green, blue, force, callback, context)
    {
        if (direction === undefined) { direction = true; }
        if (duration === undefined) { duration = 1000; }
        if (red === undefined) { red = 0; }
        if (green === undefined) { green = 0; }
        if (blue === undefined) { blue = 0; }
        if (force === undefined) { force = false; }
        if (callback === undefined) { callback = null; }
        if (context === undefined) { context = this.camera.scene; }

        if (!force && this.isRunning)
        {
            return this.camera;
        }

        this.isRunning = true;
        this.isComplete = false;
        this.duration = duration;
        this.direction = direction;
        this.progress = 0;

        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = (direction) ? Number.MIN_VALUE : 1;

        this._elapsed = 0;

        this._onUpdate = callback;
        this._onUpdateScope = context;

        var eventName = (direction) ? Events.FADE_OUT_START : Events.FADE_IN_START;

        this.camera.emit(eventName, this.camera, this, duration, red, green, blue);

        return this.camera;
    },

    update: function (time, delta)
    {
        if (!this.isRunning)
        {
            return;
        }

        this._elapsed += delta;

        this.progress = Clamp(this._elapsed / this.duration, 0, 1);

        if (this._onUpdate)
        {
            this._onUpdate.call(this._onUpdateScope, this.camera, this.progress);
        }

        if (this._elapsed < this.duration)
        {
            this.alpha = (this.direction) ? this.progress : 1 - this.progress;
        }
        else
        {
            this.alpha = (this.direction) ? 1 : 0;
            this.effectComplete();
        }
    },

    postRenderCanvas: function (ctx)
    {
        if (!this.isRunning && !this.isComplete)
        {
            return false;
        }

        var camera = this.camera;

        ctx.fillStyle = 'rgba(' + this.red + ',' + this.green + ',' + this.blue + ',' + this.alpha + ')';
        ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

        return true;
    },

    postRenderWebGL: function (pipeline, getTintFunction)
    {
        if (!this.isRunning && !this.isComplete)
        {
            return false;
        }

        var camera = this.camera;
        var red = this.red / 255;
        var green = this.green / 255;
        var blue = this.blue / 255;

        pipeline.drawFillRect(
            camera.x, camera.y, camera.width, camera.height,
            getTintFunction(blue, green, red, 1),
            this.alpha
        );

        return true;
    },

    effectComplete: function ()
    {
        this._onUpdate = null;
        this._onUpdateScope = null;

        this.isRunning = false;
        this.isComplete = true;

        var eventName = (this.direction) ? Events.FADE_OUT_COMPLETE : Events.FADE_IN_COMPLETE;

        this.camera.emit(eventName, this.camera, this);
    },

    reset: function ()
    {
        this.isRunning = false;
        this.isComplete = false;

        this._onUpdate = null;
        this._onUpdateScope = null;
    },

    destroy: function ()
    {
        this.reset();

        this.camera = null;
    }

});

module.exports = Fade;
