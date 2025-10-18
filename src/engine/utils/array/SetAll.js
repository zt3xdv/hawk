var SafeRange = require('./SafeRange');

var SetAll = function (array, property, value, startIndex, endIndex)
{
    if (startIndex === undefined) { startIndex = 0; }
    if (endIndex === undefined) { endIndex = array.length; }

    if (SafeRange(array, startIndex, endIndex))
    {
        for (var i = startIndex; i < endIndex; i++)
        {
            var entry = array[i];

            if (entry.hasOwnProperty(property))
            {
                entry[property] = value;
            }
        }
    }

    return array;
};

module.exports = SetAll;
