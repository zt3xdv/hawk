var Clamp = require('../../../math/Clamp');
var Class = require('../../../utils/Class');
var Events = require('../events');

var Flash = new Class({

    initialize:

    function Flash (camera)
    {

        this.camera = camera;

        this.isRunning = false;

        this.duration = 0;

        this.red = 0;

        this.green = 0;

        this.blue = 0;

        this.alpha = 1;

        this.progress = 0;

        this._elapsed = 0;

        this._alpha;

        this._onUpdate;

        this._onUpdateScope;
    },

    start: function (duration, red, green, blue, force, callback, context)
    {
        if (duration === undefined) { duration = 250; }
        if (red === undefined) { red = 255; }
        if (green === undefined) { green = 255; }
        if (blue === undefined) { blue = 255; }
        if (force === undefined) { force = false; }
        if (callback === undefined) { callback = null; }
        if (context === undefined) { context = this.camera.scene; }

        if (!force && this.isRunning)
        {
            return this.camera;
        }

        this.isRunning = true;
        this.duration = duration;
        this.progress = 0;

        this.red = red;
        this.green = green;
        this.blue = blue;

        this._alpha = this.alpha;
        this._elapsed = 0;

        this._onUpdate = callback;
        this._onUpdateScope = context;

        this.camera.emit(Events.FLASH_START, this.camera, this, duration, red, green, blue);

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
            this.alpha = this._alpha * (1 - this.progress);
        }
        else
        {
            this.effectComplete();
        }
    },

    postRenderCanvas: function (ctx)
    {
        if (!this.isRunning)
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
        if (!this.isRunning)
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
        this.alpha = this._alpha;
        this._onUpdate = null;
        this._onUpdateScope = null;

        this.isRunning = false;

        this.camera.emit(Events.FLASH_COMPLETE, this.camera, this);
    },

    reset: function ()
    {
        this.isRunning = false;

        this._onUpdate = null;
        this._onUpdateScope = null;
    },

    destroy: function ()
    {
        this.reset();

        this.camera = null;
    }

});

module.exports = Flash;
