var AddAt = function (array, item, index, limit, callback, context)
{
    if (index === undefined) { index = 0; }
    if (context === undefined) { context = array; }

    if (limit > 0)
    {
        var remaining = limit - array.length;

        if (remaining <= 0)
        {
            return null;
        }
    }

    if (!Array.isArray(item))
    {
        if (array.indexOf(item) === -1)
        {
            array.splice(index, 0, item);

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

    while (itemLength >= 0)
    {
        if (array.indexOf(item[itemLength]) !== -1)
        {

            item.pop();
        }

        itemLength--;
    }

    itemLength = item.length;

    if (itemLength === 0)
    {
        return null;
    }

    if (limit > 0 && itemLength > remaining)
    {
        item.splice(remaining);

        itemLength = remaining;
    }

    for (var i = itemLength - 1; i >= 0; i--)
    {
        var entry = item[i];

        array.splice(index, 0, entry);

        if (callback)
        {
            callback.call(context, entry);
        }
    }

    return item;
};

module.exports = AddAt;
