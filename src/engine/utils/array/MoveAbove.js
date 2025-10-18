var MoveAbove = function (array, item1, item2)
{
    if (item1 === item2)
    {
        return array;
    }

    var currentIndex = array.indexOf(item1);
    var baseIndex = array.indexOf(item2);

    if (currentIndex < 0 || baseIndex < 0)
    {
        throw new Error('Supplied items must be elements of the same array');
    }

    if (currentIndex > baseIndex)
    {

        return array;
    }

    array.splice(currentIndex, 1);

    baseIndex = array.indexOf(item2);

    array.splice(baseIndex + 1, 0, item1);

    return array;
};

module.exports = MoveAbove;
