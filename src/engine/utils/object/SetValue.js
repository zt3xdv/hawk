var SetValue = function (source, key, value)
{
    if (!source || typeof source === 'number')
    {
        return false;
    }
    else if (source.hasOwnProperty(key))
    {
        source[key] = value;

        return true;
    }
    else if (key.indexOf('.') !== -1)
    {
        var keys = key.split('.');
        var parent = source;
        var prev = source;

        for (var i = 0; i < keys.length; i++)
        {
            if (parent.hasOwnProperty(keys[i]))
            {

                prev = parent;
                parent = parent[keys[i]];
            }
            else
            {
                return false;
            }
        }

        prev[keys[keys.length - 1]] = value;

        return true;
    }

    return false;
};

module.exports = SetValue;
