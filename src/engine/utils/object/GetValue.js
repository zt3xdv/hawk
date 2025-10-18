var GetValue = function (source, key, defaultValue, altSource)
{
    if ((!source && !altSource) || typeof source === 'number')
    {
        return defaultValue;
    }
    else if (source && source.hasOwnProperty(key))
    {
        return source[key];
    }
    else if (altSource && altSource.hasOwnProperty(key))
    {
        return altSource[key];
    }
    else if (key.indexOf('.') !== -1)
    {
        var keys = key.split('.');
        var parentA = source;
        var parentB = altSource;
        var valueA = defaultValue;
        var valueB = defaultValue;
        var valueAFound = true;
        var valueBFound = true;

        for (var i = 0; i < keys.length; i++)
        {
            if (parentA && parentA.hasOwnProperty(keys[i]))
            {

                valueA = parentA[keys[i]];
                parentA = parentA[keys[i]];
            }
            else
            {
                valueAFound = false;
            }

            if (parentB && parentB.hasOwnProperty(keys[i]))
            {

                valueB = parentB[keys[i]];
                parentB = parentB[keys[i]];
            }
            else
            {
                valueBFound = false;
            }
        }

        if (valueAFound)
        {
            return valueA;
        }
        else if (valueBFound)
        {
            return valueB;
        }
        else
        {
            return defaultValue;
        }
    }
    else
    {
        return defaultValue;
    }
};

module.exports = GetValue;
