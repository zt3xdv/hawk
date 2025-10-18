var Rectangle = require('./Rectangle');
var MATH_CONST = require('../../math/const');

var FromPoints = function (points, out)
{
    if (out === undefined) { out = new Rectangle(); }

    if (points.length === 0)
    {
        return out;
    }

    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;

    var maxX = MATH_CONST.MIN_SAFE_INTEGER;
    var maxY = MATH_CONST.MIN_SAFE_INTEGER;

    var p;
    var px;
    var py;

    for (var i = 0; i < points.length; i++)
    {
        p = points[i];

        if (Array.isArray(p))
        {
            px = p[0];
            py = p[1];
        }
        else
        {
            px = p.x;
            py = p.y;
        }

        minX = Math.min(minX, px);
        minY = Math.min(minY, py);

        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
    }

    out.x = minX;
    out.y = minY;
    out.width = maxX - minX;
    out.height = maxY - minY;

    return out;
};

module.exports = FromPoints;
