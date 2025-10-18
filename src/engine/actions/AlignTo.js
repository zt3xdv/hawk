var QuickSet = require('../display/align/to/QuickSet');

var AlignTo = function (items, position, offsetX, offsetY)
{
    var target = items[0];

    for (var i = 1; i < items.length; i++)
    {
        var item = items[i];

        QuickSet(item, target, position, offsetX, offsetY);

        target = item;
    }

    return items;
};

module.exports = AlignTo;
