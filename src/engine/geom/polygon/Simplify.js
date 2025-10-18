function getSqDist (p1, p2)
{
    var dx = p1.x - p2.x,
        dy = p1.y - p2.y;

    return dx * dx + dy * dy;
}

function getSqSegDist (p, p1, p2)
{
    var x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y;

    if (dx !== 0 || dy !== 0)
    {
        var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

        if (t > 1)
        {
            x = p2.x;
            y = p2.y;
        }
        else if (t > 0)
        {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
}

function simplifyRadialDist (points, sqTolerance)
{
    var prevPoint = points[0],
        newPoints = [ prevPoint ],
        point;

    for (var i = 1, len = points.length; i < len; i++)
    {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance)
        {
            newPoints.push(point);
            prevPoint = point;
        }
    }

    if (prevPoint !== point)
    {
        newPoints.push(point);
    }

    return newPoints;
}

function simplifyDPStep (points, first, last, sqTolerance, simplified)
{
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++)
    {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist)
        {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance)
    {
        if (index - first > 1)
        {
            simplifyDPStep(points, first, index, sqTolerance, simplified);
        }

        simplified.push(points[index]);

        if (last - index > 1)
        {
            simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }
}

function simplifyDouglasPeucker (points, sqTolerance)
{
    var last = points.length - 1;

    var simplified = [ points[0] ];

    simplifyDPStep(points, 0, last, sqTolerance, simplified);

    simplified.push(points[last]);

    return simplified;
}

var Simplify = function (polygon, tolerance, highestQuality)
{
    if (tolerance === undefined) { tolerance = 1; }
    if (highestQuality === undefined) { highestQuality = false; }

    var points = polygon.points;

    if (points.length > 2)
    {
        var sqTolerance = tolerance * tolerance;

        if (!highestQuality)
        {
            points = simplifyRadialDist(points, sqTolerance);
        }

        polygon.setTo(simplifyDouglasPeucker(points, sqTolerance));
    }

    return polygon;
};

module.exports = Simplify;
