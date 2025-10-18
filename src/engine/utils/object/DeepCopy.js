var DeepCopy = function (inObject)
{
    var outObject;
    var value;
    var key;

    if (typeof inObject !== 'object' || inObject === null)
    {

        return inObject;
    }

    outObject = Array.isArray(inObject) ? [] : {};

    for (key in inObject)
    {
        value = inObject[key];

        outObject[key] = DeepCopy(value);
    }

    return outObject;
};

module.exports = DeepCopy;
