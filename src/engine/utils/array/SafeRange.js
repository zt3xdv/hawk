var SafeRange = function (array, startIndex, endIndex, throwError)
{
    var len = array.length;

    if (startIndex < 0 ||
        startIndex >= len ||
        startIndex >= endIndex ||
        endIndex > len)
    {
        if (throwError)
        {
            throw new Error('Range Error: Values outside acceptable range');
        }

        return false;
    }
    else
    {
        return true;
    }
};

module.exports = SafeRange;
