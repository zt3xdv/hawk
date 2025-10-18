var DistanceBetweenPointsSquared = function (a, b)
{
    var dx = a.x - b.x;
    var dy = a.y - b.y;

    return dx * dx + dy * dy;
};

module.exports = DistanceBetweenPointsSquared;
