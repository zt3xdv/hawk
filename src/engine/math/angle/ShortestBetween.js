var ShortestBetween = function (angle1, angle2)
{
    var difference = angle2 - angle1;

    if (difference === 0)
    {
        return 0;
    }

    var times = Math.floor((difference - (-180)) / 360);

    return difference - (times * 360);

};

module.exports = ShortestBetween;
