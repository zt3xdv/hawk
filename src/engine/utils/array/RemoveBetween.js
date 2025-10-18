var SafeRange = require('./SafeRange');

var RemoveBetween = function (array, startIndex, endIndex, callback, context)
{
    if (startIndex === undefined) { startIndex = 0; }
    if (endIndex === undefined) { endIndex = array.length; }
    if (context === undefined) { context = array; }

    if (SafeRange(array, startIndex, endIndex))
    {
        var size = endIndex - startIndex;

        var removed = array.splice(startIndex, size);

        if (callback)
        {
            for (var i = 0; i < removed.length; i++)
            {
                var entry = removed[i];

                callback.call(context, entry);
            }
        }

        return removed;
    }
    else
    {
        return [];
    }
};

module.exports = RemoveBetween;
