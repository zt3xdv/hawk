var SafeRange = require('./SafeRange');

var GetFirst = function (array, property, value, startIndex, endIndex)
{
    if (startIndex === undefined) { startIndex = 0; }
    if (endIndex === undefined) { endIndex = array.length; }

    if (startIndex !== -1)
    {
        if (SafeRange(array, startIndex, endIndex))
        {
            for (var i = startIndex; i < endIndex; i++)
            {
                var child = array[i];

                if (!property ||
                    (property && value === undefined && child.hasOwnProperty(property)) ||
                    (property && value !== undefined && child[property] === value))
                {
                    return child;
                }
            }
        }
    }
    else
    {
        if (SafeRange(array, 0, endIndex))
        {
            for (var i = endIndex; i >= 0; i--)
            {
                var child = array[i];

                if (!property ||
                    (property && value === undefined && child.hasOwnProperty(property)) ||
                    (property && value !== undefined && child[property] === value))
                {
                    return child;
                }
            }
        }
    }

    return null;
};

module.exports = GetFirst;
