var SpliceOne = require('./SpliceOne');

var Remove = function (array, item, callback, context)
{
    if (context === undefined) { context = array; }

    var index;

    if (!Array.isArray(item))
    {
        index = array.indexOf(item);

        if (index !== -1)
        {
            SpliceOne(array, index);

            if (callback)
            {
                callback.call(context, item);
            }

            return item;
        }
        else
        {
            return null;
        }
    }

    var itemLength = item.length - 1;
    var removed = [];

    while (itemLength >= 0)
    {
        var entry = item[itemLength];

        index = array.indexOf(entry);

        if (index !== -1)
        {
            SpliceOne(array, index);

            removed.push(entry);

            if (callback)
            {
                callback.call(context, entry);
            }
        }

        itemLength--;
    }

    return removed;
};

module.exports = Remove;
