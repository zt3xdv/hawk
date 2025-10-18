var GetLineToCircle = require('./GetLineToCircle');
var TriangleToCircle = require('./TriangleToCircle');

var GetTriangleToCircle = function (triangle, circle, out)
{
    if (out === undefined) { out = []; }

    if (TriangleToCircle(triangle, circle))
    {
        var lineA = triangle.getLineA();
        var lineB = triangle.getLineB();
        var lineC = triangle.getLineC();

        GetLineToCircle(lineA, circle, out);
        GetLineToCircle(lineB, circle, out);
        GetLineToCircle(lineC, circle, out);
    }

    return out;
};

module.exports = GetTriangleToCircle;
