var Contains = function (polygon, x, y)
{
    var inside = false;

    for (var i = -1, j = polygon.points.length - 1; ++i < polygon.points.length; j = i)
    {
        var ix = polygon.points[i].x;
        var iy = polygon.points[i].y;

        var jx = polygon.points[j].x;
        var jy = polygon.points[j].y;

        if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix))
        {
            inside = !inside;
        }
    }

    return inside;
};

module.exports = Contains;
