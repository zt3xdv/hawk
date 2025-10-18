var Color = require('./Color');

var HexStringToColor = function (hex)
{
    var color = new Color();

    hex = hex.replace(/^(?:#|0x)?([a-f\d])([a-f\d])([a-f\d])$/i, function (m, r, g, b)
    {
        return r + r + g + g + b + b;
    });

    var result = (/^(?:#|0x)?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);

    if (result)
    {
        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);

        color.setTo(r, g, b);
    }

    return color;
};

module.exports = HexStringToColor;
