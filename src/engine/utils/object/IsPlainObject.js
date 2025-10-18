var IsPlainObject = function (obj)
{

    if (!obj || typeof(obj) !== 'object' || obj.nodeType || obj === obj.window)
    {
        return false;
    }

    try
    {
        if (obj.constructor && !({}).hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf'))
        {
            return false;
        }
    }
    catch (e)
    {
        return false;
    }

    return true;
};

module.exports = IsPlainObject;
