var Vector2 = require('./Vector2');

var TransformXY = function (x, y, positionX, positionY, rotation, scaleX, scaleY, output)
{
    if (output === undefined) { output = new Vector2(); }

    var radianSin = Math.sin(rotation);
    var radianCos = Math.cos(rotation);

    var a = radianCos * scaleX;
    var b = radianSin * scaleX;
    var c = -radianSin * scaleY;
    var d = radianCos * scaleY;

    var id = 1 / ((a * d) + (c * -b));

    output.x = (d * id * x) + (-c * id * y) + (((positionY * c) - (positionX * d)) * id);
    output.y = (a * id * y) + (-b * id * x) + (((-positionY * a) + (positionX * b)) * id);

    return output;
};

module.exports = TransformXY;
