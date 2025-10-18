var Stepped = function (v, steps)
{
    if (steps === undefined) { steps = 1; }

    if (v <= 0)
    {
        return 0;
    }
    else if (v >= 1)
    {
        return 1;
    }
    else
    {
        return (((steps * v) | 0) + 1) * (1 / steps);
    }
};

module.exports = Stepped;
