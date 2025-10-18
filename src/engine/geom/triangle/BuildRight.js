var Triangle = require('./Triangle');

var BuildRight = function (x, y, width, height)
{
    if (height === undefined) { height = width; }

    var x1 = x;
    var y1 = y;

    var x2 = x;
    var y2 = y - height;

    var x3 = x + width;
    var y3 = y;

    return new Triangle(x1, y1, x2, y2, x3, y3);
};

module.exports = BuildRight;
