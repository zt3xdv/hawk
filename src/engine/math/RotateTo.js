var RotateTo = function (point, x, y, angle, distance)
{
    point.x = x + (distance * Math.cos(angle));
    point.y = y + (distance * Math.sin(angle));

    return point;
};

module.exports = RotateTo;
