var Vector4 = require('../../math/Vector4');
var GetLineToPolygon = require('./GetLineToPolygon');
var Line = require('../line/Line');

var segment = new Line();

function CheckIntersects (angle, x, y, polygons, intersects)
{
    var dx = Math.cos(angle);
    var dy = Math.sin(angle);

    segment.setTo(x, y, x + dx, y + dy);

    var closestIntersect = GetLineToPolygon(segment, polygons, true);

    if (closestIntersect)
    {
        intersects.push(new Vector4(closestIntersect.x, closestIntersect.y, angle, closestIntersect.w));
    }
}

function SortIntersects (a, b)
{
    return a.z - b.z;
}

var GetRaysFromPointToPolygon = function (x, y, polygons)
{
    if (!Array.isArray(polygons))
    {
        polygons = [ polygons ];
    }

    var intersects = [];
    var angles = [];

    for (var i = 0; i < polygons.length; i++)
    {
        var points = polygons[i].points;

        for (var p = 0; p < points.length; p++)
        {
            var angle = Math.atan2(points[p].y - y, points[p].x - x);

            if (angles.indexOf(angle) === -1)
            {

                CheckIntersects(angle, x, y, polygons, intersects);
                CheckIntersects(angle - 0.00001, x, y, polygons, intersects);
                CheckIntersects(angle + 0.00001, x, y, polygons, intersects);

                angles.push(angle);
            }
        }
    }

    return intersects.sort(SortIntersects);
};

module.exports = GetRaysFromPointToPolygon;
