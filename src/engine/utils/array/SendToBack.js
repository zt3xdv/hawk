var SendToBack = function (array, item)
{
    var currentIndex = array.indexOf(item);

    if (currentIndex !== -1 && currentIndex > 0)
    {
        array.splice(currentIndex, 1);
        array.unshift(item);
    }

    return item;
};

module.exports = SendToBack;
