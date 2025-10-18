var Linear = require('../../math/Linear');
var GetColor = require('./GetColor');

var RGBWithRGB = function (r1, g1, b1, r2, g2, b2, length, index)
{
    if (length === undefined) { length = 100; }
    if (index === undefined) { index = 0; }

    var t = index / length;
    var r = Linear(r1, r2, t);
    var g = Linear(g1, g2, t);
    var b = Linear(b1, b2, t);

    return {
        r: r,
        g: g,
        b: b,
        a: 255,
        color: GetColor(r, g, b)
    };
};

var ColorWithColor = function (color1, color2, length, index)
{
    if (length === undefined) { length = 100; }
    if (index === undefined) { index = 0; }

    return RGBWithRGB(color1.r, color1.g, color1.b, color2.r, color2.g, color2.b, length, index);
};

var ColorWithRGB = function (color, r, g, b, length, index)
{
    if (length === undefined) { length = 100; }
    if (index === undefined) { index = 0; }

    return RGBWithRGB(color.r, color.g, color.b, r, g, b, length, index);
};

module.exports = {

    RGBWithRGB: RGBWithRGB,
    ColorWithRGB: ColorWithRGB,
    ColorWithColor: ColorWithColor

};
