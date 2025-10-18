var NormalizeAngle = require('./Normalize');

var TAU = 2 * Math.PI;

var GetCounterClockwiseDistance = function (angle1, angle2)
{
    var distance = NormalizeAngle(angle2 - angle1);

    if (distance > 0)
    {
        distance -= TAU;
    }

    return distance;
};

module.exports = GetCounterClockwiseDistance;
