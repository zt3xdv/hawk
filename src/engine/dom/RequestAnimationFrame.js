var Class = require('../utils/Class');
var NOOP = require('../utils/NOOP');

var RequestAnimationFrame = new Class({

    initialize:

    function RequestAnimationFrame ()
    {

        this.isRunning = false;

        this.callback = NOOP;

        this.isSetTimeOut = false;

        this.timeOutID = null;

        this.delay = 0;

        var _this = this;

        this.step = function step (time)
        {
            _this.callback(time);

            if (_this.isRunning)
            {
                _this.timeOutID = window.requestAnimationFrame(step);
            }
        };

        this.stepTimeout = function stepTimeout ()
        {
            if (_this.isRunning)
            {

                _this.timeOutID = window.setTimeout(stepTimeout, _this.delay);
            }

            _this.callback(window.performance.now());
        };
    },

    start: function (callback, forceSetTimeOut, delay)
    {
        if (this.isRunning)
        {
            return;
        }

        this.callback = callback;

        this.isSetTimeOut = forceSetTimeOut;

        this.delay = delay;

        this.isRunning = true;

        this.timeOutID = (forceSetTimeOut) ? window.setTimeout(this.stepTimeout, 0) : window.requestAnimationFrame(this.step);
    },

    stop: function ()
    {
        this.isRunning = false;

        if (this.isSetTimeOut)
        {
            clearTimeout(this.timeOutID);
        }
        else
        {
            window.cancelAnimationFrame(this.timeOutID);
        }
    },

    destroy: function ()
    {
        this.stop();

        this.callback = NOOP;
    }

});

module.exports = RequestAnimationFrame;
