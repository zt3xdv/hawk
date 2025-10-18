var Clamp = require('../../../math/Clamp');
var Class = require('../../../utils/Class');
var EaseMap = require('../../../math/easing/EaseMap');
var Events = require('../events');

var Zoom = new Class({

    initialize:

    function Zoom (camera)
    {

        this.camera = camera;

        this.isRunning = false;

        this.duration = 0;

        this.source = 1;

        this.destination = 1;

        this.ease;

        this.progress = 0;

        this._elapsed = 0;

        this._onUpdate;

        this._onUpdateScope;
    },

    start: function (zoom, duration, ease, force, callback, context)
    {
        if (duration === undefined) { duration = 1000; }
        if (ease === undefined) { ease = EaseMap.Linear; }
        if (force === undefined) { force = false; }
        if (callback === undefined) { callback = null; }
        if (context === undefined) { context = this.camera.scene; }

        var cam = this.camera;

        if (!force && this.isRunning)
        {
            return cam;
        }

        this.isRunning = true;
        this.duration = duration;
        this.progress = 0;

        this.source = cam.zoom;

        this.destination = zoom;

        if (typeof ease === 'string' && EaseMap.hasOwnProperty(ease))
        {
            this.ease = EaseMap[ease];
        }
        else if (typeof ease === 'function')
        {
            this.ease = ease;
        }

        this._elapsed = 0;

        this._onUpdate = callback;
        this._onUpdateScope = context;

        this.camera.emit(Events.ZOOM_START, this.camera, this, duration, zoom);

        return cam;
    },

    update: function (time, delta)
    {
        if (!this.isRunning)
        {
            return;
        }

        this._elapsed += delta;

        this.progress = Clamp(this._elapsed / this.duration, 0, 1);

        if (this._elapsed < this.duration)
        {
            this.camera.zoom = this.source + ((this.destination - this.source) * this.ease(this.progress));

            if (this._onUpdate)
            {
                this._onUpdate.call(this._onUpdateScope, this.camera, this.progress, this.camera.zoom);
            }
        }
        else
        {
            this.camera.zoom = this.destination;

            if (this._onUpdate)
            {
                this._onUpdate.call(this._onUpdateScope, this.camera, this.progress, this.destination);
            }

            this.effectComplete();
        }
    },

    effectComplete: function ()
    {
        this._onUpdate = null;
        this._onUpdateScope = null;

        this.isRunning = false;

        this.camera.emit(Events.ZOOM_COMPLETE, this.camera, this);
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

module.exports = Zoom;
