

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

    
    if ('onwheel' in window || (Browser.ie && 'WheelEvent' in window))
    {
        
        Input.wheelEvent = 'wheel';
    }
    else if ('onmousewheel' in window)
    {
        
        Input.wheelEvent = 'mousewheel';
    }
    else if (Browser.firefox && 'MouseScrollEvent' in window)
    {
        
        Input.wheelEvent = 'DOMMouseScroll';
    }

    return Input;
}

module.exports = init();
