var LineToRectangle = function (line, rect)
{
    var x1 = line.x1;
    var y1 = line.y1;

    var x2 = line.x2;
    var y2 = line.y2;

    var bx1 = rect.x;
    var by1 = rect.y;
    var bx2 = rect.right;
    var by2 = rect.bottom;

    var t = 0;

    if ((x1 >= bx1 && x1 <= bx2 && y1 >= by1 && y1 <= by2) ||
        (x2 >= bx1 && x2 <= bx2 && y2 >= by1 && y2 <= by2))
    {
        return true;
    }

    if (x1 < bx1 && x2 >= bx1)
    {

        t = y1 + (y2 - y1) * (bx1 - x1) / (x2 - x1);

        if (t > by1 && t <= by2)
        {
            return true;
        }
    }
    else if (x1 > bx2 && x2 <= bx2)
    {

        t = y1 + (y2 - y1) * (bx2 - x1) / (x2 - x1);

        if (t >= by1 && t <= by2)
        {
            return true;
        }
    }

    if (y1 < by1 && y2 >= by1)
    {

        t = x1 + (x2 - x1) * (by1 - y1) / (y2 - y1);

        if (t >= bx1 && t <= bx2)
        {
            return true;
        }
    }
    else if (y1 > by2 && y2 <= by2)
    {

        t = x1 + (x2 - x1) * (by2 - y1) / (y2 - y1);

        if (t >= bx1 && t <= bx2)
        {
            return true;
        }
    }

    return false;
};

module.exports = LineToRectangle;
