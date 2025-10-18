var SetTileIndexCallback = function (indexes, callback, callbackContext, layer)
{
    if (typeof indexes === 'number')
    {
        layer.callbacks[indexes] = (callback !== null)
            ? { callback: callback, callbackContext: callbackContext }
            : undefined;
    }
    else
    {
        for (var i = 0, len = indexes.length; i < len; i++)
        {
            layer.callbacks[indexes[i]] = (callback !== null)
                ? { callback: callback, callbackContext: callbackContext }
                : undefined;
        }
    }
};

module.exports = SetTileIndexCallback;
