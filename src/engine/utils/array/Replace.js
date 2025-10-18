var Replace = function (array, oldChild, newChild)
{
    var index1 = array.indexOf(oldChild);
    var index2 = array.indexOf(newChild);

    if (index1 !== -1 && index2 === -1)
    {
        array[index1] = newChild;

        return true;
    }
    else
    {
        return false;
    }
};

module.exports = Replace;
