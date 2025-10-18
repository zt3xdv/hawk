var GetLineToLine = require('./GetLineToLine');
var Line = require('../line/Line');
var Vector3 = require('../../math/Vector3');

var segment = new Line();

var tempIntersect = new Vector3();

var GetLineToPoints = function (line, points, isRay, out)
{
    if (isRay === undefined) { isRay = false; }
    if (out === undefined) { out = new Vector3(); }

    var closestIntersect = false;

    out.set();
    tempIntersect.set();

    var prev = points[points.length - 1];

    for (var i = 0; i < points.length; i++)
    {
        var current = points[i];

        segment.setTo(prev.x, prev.y, current.x, current.y);

        prev = current;

        if (GetLineToLine(line, segment, isRay, tempIntersect))
        {
            if (!closestIntersect || tempIntersect.z < out.z)
            {
                out.copy(tempIntersect);

                closestIntersect = true;
            }
        }
    }

    return (closestIntersect) ? out : null;
};

module.exports = GetLineToPoints;
