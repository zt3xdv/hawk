var Length = require('../line/Length');

var Perimeter = function (triangle)
{
    var line1 = triangle.getLineA();
    var line2 = triangle.getLineB();
    var line3 = triangle.getLineC();

    return (Length(line1) + Length(line2) + Length(line3));
};

module.exports = Perimeter;
