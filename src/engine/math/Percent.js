var Percent = function (value, min, max, upperMax)
{
    if (max === undefined) { max = min + 1; }

    var percentage = (value - min) / (max - min);

    if (percentage > 1)
    {
        if (upperMax !== undefined)
        {
            percentage = ((upperMax - value)) / (upperMax - max);

            if (percentage < 0)
            {
                percentage = 0;
            }
        }
        else
        {
            percentage = 1;
        }
    }
    else if (percentage < 0)
    {
        percentage = 0;
    }

    return percentage;
};

module.exports = Percent;
