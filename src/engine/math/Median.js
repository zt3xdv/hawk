var Median = function (values)
{
    var valuesNum = values.length;
    if (valuesNum === 0)
    {
        return 0;
    }

    values.sort(function (a, b) { return a - b; });

    var halfIndex = Math.floor(valuesNum / 2);

    return valuesNum % 2 === 0
        ? (values[halfIndex] + values[halfIndex - 1]) / 2
        : values[halfIndex];
};

module.exports = Median;
