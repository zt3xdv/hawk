var PointToLine = function (point, line, lineThickness)
{
    if (lineThickness === undefined) { lineThickness = 1; }

    var x1 = line.x1;
    var y1 = line.y1;

    var x2 = line.x2;
    var y2 = line.y2;

    var px = point.x;
    var py = point.y;

    var L2 = (((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));

    if (L2 === 0)
    {
        return false;
    }

    var r = (((px - x1) * (x2 - x1)) + ((py - y1) * (y2 - y1))) / L2;

    if (r < 0)
    {

        return (Math.sqrt(((x1 - px) * (x1 - px)) + ((y1 - py) * (y1 - py))) <= lineThickness);
    }
    else if ((r >= 0) && (r <= 1))
    {

        var s = (((y1 - py) * (x2 - x1)) - ((x1 - px) * (y2 - y1))) / L2;

        return (Math.abs(s) * Math.sqrt(L2) <= lineThickness);
    }
    else
    {

        return (Math.sqrt(((x2 - px) * (x2 - px)) + ((y2 - py) * (y2 - py))) <= lineThickness);
    }
};

module.exports = PointToLine;
