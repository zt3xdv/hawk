

var Browser = require('./Browser');


var Input = {

    gamepads: false,
    mspointer: false,
    touch: false,
    wheelEvent: null

};

function init ()
{
    if (typeof importScripts === 'function')
    {
        return Input;
    }

    if ('ontouchstart' in document.documentElement || (navigator.maxTouchPoints && navigator.maxTouchPoints >= 1))
    {
        Input.touch = true;
    }

    if (navigator.msPointerEnabled || navigator.pointerEnabled)
    {
        Input.mspointer = true;
    }

    if (navigator.getGamepads)
    {
        Input.gamepads = true;
    }

    // See https://developer.mozilla.org/en-US/docs/Web/Events/wheel
    if ('onwheel' in window || (Browser.ie && 'WheelEvent' in window))
    {
        // DOM3 Wheel Event: FF 17+, IE 9+, Chrome 31+, Safari 7+
        Input.wheelEvent = 'wheel';
    }
    else if ('onmousewheel' in window)
    {
        // Non-FF legacy: IE 6-9, Chrome 1-31, Safari 5-7.
        Input.wheelEvent = 'mousewheel';
    }
    else if (Browser.firefox && 'MouseScrollEvent' in window)
    {
        // FF prior to 17. This should probably be scrubbed.
        Input.wheelEvent = 'DOMMouseScroll';
    }

    return Input;
}

module.exports = init();
