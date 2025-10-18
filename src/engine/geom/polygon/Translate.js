var Translate = function (polygon, x, y)
{
    var points = polygon.points;

    for (var i = 0; i < points.length; i++)
    {
        points[i].x += x;
        points[i].y += y;
    }

    return polygon;
};

module.exports = Translate;
