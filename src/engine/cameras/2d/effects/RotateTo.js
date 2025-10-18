var Clamp = require('../../../math/Clamp');
var Class = require('../../../utils/Class');
var Events = require('../events');
var EaseMap = require('../../../math/easing/EaseMap');

var RotateTo = new Class({

    initialize:

    function RotateTo (camera)
    {

        this.camera = camera;

        this.isRunning = false;

        this.duration = 0;

        this.source = 0;

        this.current = 0;

        this.destination = 0;

        this.ease;

        this.progress = 0;

        this._elapsed = 0;

        this._onUpdate;

        this._onUpdateScope;

        this.clockwise = true;

        this.shortestPath = false;
    },

    start: function (radians, shortestPath, duration, ease, force, callback, context)
    {
        if (duration === undefined) { duration = 1000; }
        if (ease === undefined) { ease = EaseMap.Linear; }
        if (force === undefined) { force = false; }
        if (callback === undefined) { callback = null; }
        if (context === undefined) { context = this.camera.scene; }
        if (shortestPath === undefined) { shortestPath = false; }

        this.shortestPath = shortestPath;

        var tmpDestination = radians;

        if (radians < 0)
        {
            tmpDestination = -1 * radians;
            this.clockwise = false;
        }
        else
        {
            this.clockwise = true;
        }

        var maxRad = (360 * Math.PI) / 180;

        tmpDestination = tmpDestination - (Math.floor(tmpDestination / maxRad) * maxRad);

        var cam = this.camera;

        if (!force && this.isRunning)
        {
            return cam;
        }

        this.isRunning = true;
        this.duration = duration;
        this.progress = 0;

        this.source = cam.rotation;

        this.destination = tmpDestination;

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

        if (this.shortestPath)
        {

            var cwDist = 0;
            var acwDist = 0;

            if (this.destination > this.source)
            {
                cwDist = Math.abs(this.destination - this.source);
            }
            else
            {
                cwDist = (Math.abs(this.destination + maxRad) - this.source);
            }

            if (this.source > this.destination)
            {
                acwDist = Math.abs(this.source - this.destination);
            }
            else
            {
                acwDist = (Math.abs(this.source + maxRad) - this.destination);
            }

            if (cwDist < acwDist)
            {
                this.clockwise = true;
            }
            else if (cwDist > acwDist)
            {
                this.clockwise = false;
            }
        }

        this.camera.emit(Events.ROTATE_START, this.camera, this, duration, tmpDestination);

        return cam;
    },

    update: function (time, delta)
    {
        if (!this.isRunning)
        {
            return;
        }

        this._elapsed += delta;

        var progress = Clamp(this._elapsed / this.duration, 0, 1);

        this.progress = progress;

        var cam = this.camera;

        if (this._elapsed < this.duration)
        {
            var v = this.ease(progress);

            this.current = cam.rotation;
            var distance = 0;
            var maxRad = (360 * Math.PI) / 180;
            var target = this.destination;
            var current = this.current;

            if (this.clockwise === false)
            {
                target = this.current;
                current = this.destination;
            }

            if (target >= current)
            {
                distance = Math.abs(target - current);
            }
            else
            {
                distance = (Math.abs(target + maxRad) - current);
            }

            var r = 0;

            if (this.clockwise)
            {
                r = (cam.rotation + (distance * v));
            }
            else
            {
                r = (cam.rotation - (distance * v));
            }

            cam.rotation = r;

            if (this._onUpdate)
            {
                this._onUpdate.call(this._onUpdateScope, cam, progress, r);
            }
        }
        else
        {
            cam.rotation = this.destination;

            if (this._onUpdate)
            {
                this._onUpdate.call(this._onUpdateScope, cam, progress, this.destination);
            }

            this.effectComplete();
        }
    },

    effectComplete: function ()
    {
        this._onUpdate = null;
        this._onUpdateScope = null;

        this.isRunning = false;

        this.camera.emit(Events.ROTATE_COMPLETE, this.camera, this);
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
        this.source = null;
        this.destination = null;
    }

});

module.exports = RotateTo;
