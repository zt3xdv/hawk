var Swap = function (array, item1, item2)
{
    if (item1 === item2)
    {
        return array;
    }

    var index1 = array.indexOf(item1);
    var index2 = array.indexOf(item2);

    if (index1 < 0 || index2 < 0)
    {
        throw new Error('Supplied items must be elements of the same array');
    }

    array[index1] = item2;
    array[index2] = item1;

    return array;
};

module.exports = Swap;
