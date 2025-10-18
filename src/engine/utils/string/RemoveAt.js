var RemoveAt = function (string, index)
{
    if (index === 0)
    {
        return string.slice(1);
    }
    else
    {
        return string.slice(0, index) + string.slice(index + 1);
    }
};

module.exports = RemoveAt;
