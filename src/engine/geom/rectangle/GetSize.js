var Point = require('../point/Point');

var GetSize = function (rect, out)
{
    if (out === undefined) { out = new Point(); }

    out.x = rect.width;
    out.y = rect.height;

    return out;
};

module.exports = GetSize;
