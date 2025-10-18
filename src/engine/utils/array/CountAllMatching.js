var SafeRange = require('./SafeRange');

var CountAllMatching = function (array, property, value, startIndex, endIndex)
{
    if (startIndex === undefined) { startIndex = 0; }
    if (endIndex === undefined) { endIndex = array.length; }

    var total = 0;

    if (SafeRange(array, startIndex, endIndex))
    {
        for (var i = startIndex; i < endIndex; i++)
        {
            var child = array[i];

            if (child[property] === value)
            {
                total++;
            }
        }
    }

    return total;
};

module.exports = CountAllMatching;
