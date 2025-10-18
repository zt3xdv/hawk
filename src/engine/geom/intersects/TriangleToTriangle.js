var ContainsArray = require('../triangle/ContainsArray');
var Decompose = require('../triangle/Decompose');
var LineToLine = require('./LineToLine');

var TriangleToTriangle = function (triangleA, triangleB)
{

    if (
        triangleA.left > triangleB.right ||
        triangleA.right < triangleB.left ||
        triangleA.top > triangleB.bottom ||
        triangleA.bottom < triangleB.top)
    {
        return false;
    }

    var lineAA = triangleA.getLineA();
    var lineAB = triangleA.getLineB();
    var lineAC = triangleA.getLineC();

    var lineBA = triangleB.getLineA();
    var lineBB = triangleB.getLineB();
    var lineBC = triangleB.getLineC();

    if (LineToLine(lineAA, lineBA) || LineToLine(lineAA, lineBB) || LineToLine(lineAA, lineBC))
    {
        return true;
    }

    if (LineToLine(lineAB, lineBA) || LineToLine(lineAB, lineBB) || LineToLine(lineAB, lineBC))
    {
        return true;
    }

    if (LineToLine(lineAC, lineBA) || LineToLine(lineAC, lineBB) || LineToLine(lineAC, lineBC))
    {
        return true;
    }

    var points = Decompose(triangleA);
    var within = ContainsArray(triangleB, points, true);

    if (within.length > 0)
    {
        return true;
    }

    points = Decompose(triangleB);
    within = ContainsArray(triangleA, points, true);

    if (within.length > 0)
    {
        return true;
    }

    return false;
};

module.exports = TriangleToTriangle;
