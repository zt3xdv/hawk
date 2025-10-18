var SpliceOne = require('./SpliceOne');

var RemoveAt = function (array, index, callback, context)
{
    if (context === undefined) { context = array; }

    if (index < 0 || index > array.length - 1)
    {
        throw new Error('Index out of bounds');
    }

    var item = SpliceOne(array, index);

    if (callback)
    {
        callback.call(context, item);
    }

    return item;
};

module.exports = RemoveAt;
