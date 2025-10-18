var Length = require('../line/Length');
var Point = require('../point/Point');

var GetPoints = function (triangle, quantity, stepRate, out)
{
    if (out === undefined) { out = []; }

    var line1 = triangle.getLineA();
    var line2 = triangle.getLineB();
    var line3 = triangle.getLineC();

    var length1 = Length(line1);
    var length2 = Length(line2);
    var length3 = Length(line3);

    var perimeter = length1 + length2 + length3;

    if (!quantity && stepRate > 0)
    {
        quantity = perimeter / stepRate;
    }

    for (var i = 0; i < quantity; i++)
    {
        var p = perimeter * (i / quantity);
        var localPosition = 0;

        var point = new Point();

        if (p < length1)
        {

            localPosition = p / length1;

            point.x = line1.x1 + (line1.x2 - line1.x1) * localPosition;
            point.y = line1.y1 + (line1.y2 - line1.y1) * localPosition;
        }
        else if (p > length1 + length2)
        {

            p -= length1 + length2;
            localPosition = p / length3;

            point.x = line3.x1 + (line3.x2 - line3.x1) * localPosition;
            point.y = line3.y1 + (line3.y2 - line3.y1) * localPosition;
        }
        else
        {

            p -= length1;
            localPosition = p / length2;

            point.x = line2.x1 + (line2.x2 - line2.x1) * localPosition;
            point.y = line2.y1 + (line2.y2 - line2.y1) * localPosition;
        }

        out.push(point);
    }

    return out;
};

module.exports = GetPoints;
