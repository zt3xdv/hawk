var Flatten = function (array, output)
{
    if (output === undefined) { output = []; }

    for (var i = 0; i < array.length; i++)
    {
        if (Array.isArray(array[i]))
        {
            Flatten(array[i], output);
        }
        else
        {
            output.push(array[i]);
        }
    }

    return output;
};

module.exports = Flatten;
