var GetLineToRectangle = require('./GetLineToRectangle');
var RectangleToRectangle = require('./RectangleToRectangle');

var GetRectangleToRectangle = function (rectA, rectB, out)
{
    if (out === undefined) { out = []; }

    if (RectangleToRectangle(rectA, rectB))
    {
        var lineA = rectA.getLineA();
        var lineB = rectA.getLineB();
        var lineC = rectA.getLineC();
        var lineD = rectA.getLineD();

        GetLineToRectangle(lineA, rectB, out);
        GetLineToRectangle(lineB, rectB, out);
        GetLineToRectangle(lineC, rectB, out);
        GetLineToRectangle(lineD, rectB, out);
    }

    return out;
};

module.exports = GetRectangleToRectangle;
