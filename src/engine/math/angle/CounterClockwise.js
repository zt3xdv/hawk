var CONST = require('../const');

var CounterClockwise = function (angle)
{
    if (angle > Math.PI)
    {
        angle -= CONST.PI2;
    }

    return Math.abs((((angle + CONST.TAU) % CONST.PI2) - CONST.PI2) % CONST.PI2);
};

module.exports = CounterClockwise;
