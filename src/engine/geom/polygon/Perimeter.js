var Length = require('../line/Length');
var Line = require('../line/Line');

var Perimeter = function (polygon)
{
    var points = polygon.points;
    var perimeter = 0;

    for (var i = 0; i < points.length; i++)
    {
        var pointA = points[i];
        var pointB = points[(i + 1) % points.length];
        var line = new Line(
            pointA.x,
            pointA.y,
            pointB.x,
            pointB.y
        );

        perimeter += Length(line);
    }

    return perimeter;
};

module.exports = Perimeter;
