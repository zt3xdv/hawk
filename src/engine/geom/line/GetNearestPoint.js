var Point = require('../point/Point');

var GetNearestPoint = function (line, point, out)
{
    if (out === undefined) { out = new Point(); }

    var x1 = line.x1;
    var y1 = line.y1;

    var x2 = line.x2;
    var y2 = line.y2;

    var L2 = (((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));

    if (L2 === 0)
    {
        return out;
    }

    var r = (((point.x - x1) * (x2 - x1)) + ((point.y - y1) * (y2 - y1))) / L2;

    out.x = x1 + (r * (x2 - x1));
    out.y = y1 + (r * (y2 - y1));

    return out;
};

module.exports = GetNearestPoint;
