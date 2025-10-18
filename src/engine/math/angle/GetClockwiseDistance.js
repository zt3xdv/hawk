var NormalizeAngle = require('./Normalize');

var GetClockwiseDistance = function (angle1, angle2)
{
    return NormalizeAngle(angle2 - angle1);
};

module.exports = GetClockwiseDistance;
