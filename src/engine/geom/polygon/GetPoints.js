var Length = require('../line/Length');
var Line = require('../line/Line');
var Perimeter = require('./Perimeter');

var GetPoints = function (polygon, quantity, stepRate, out)
{
    if (out === undefined) { out = []; }

    var points = polygon.points;
    var perimeter = Perimeter(polygon);

    if (!quantity && stepRate > 0)
    {
        quantity = perimeter / stepRate;
    }

    for (var i = 0; i < quantity; i++)
    {
        var position = perimeter * (i / quantity);
        var accumulatedPerimeter = 0;

        for (var j = 0; j < points.length; j++)
        {
            var pointA = points[j];
            var pointB = points[(j + 1) % points.length];
            var line = new Line(
                pointA.x,
                pointA.y,
                pointB.x,
                pointB.y
            );
            var length = Length(line);

            if (position < accumulatedPerimeter || position > accumulatedPerimeter + length)
            {
                accumulatedPerimeter += length;
                continue;
            }

            var point = line.getPoint((position - accumulatedPerimeter) / length);
            out.push(point);

            break;
        }
    }

    return out;
};

module.exports = GetPoints;
