var Format = function (string, values)
{
    return string.replace(/%([0-9]+)/g, function (s, n)
    {
        return values[Number(n) - 1];
    });
};

module.exports = Format;
