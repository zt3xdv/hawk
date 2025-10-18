var Bezier = require('../../math/interpolation/BezierInterpolation');
var CatmullRom = require('../../math/interpolation/CatmullRomInterpolation');
var Linear = require('../../math/interpolation/LinearInterpolation');

var FuncMap = {
    bezier: Bezier,
    catmull: CatmullRom,
    catmullrom: CatmullRom,
    linear: Linear
};

var GetInterpolationFunction = function (interpolation)
{
    if (interpolation === null)
    {
        return null;
    }

    var interpolationFunction = FuncMap.linear;

    if (typeof interpolation === 'string')
    {

        if (FuncMap.hasOwnProperty(interpolation))
        {
            interpolationFunction = FuncMap[interpolation];
        }
    }
    else if (typeof interpolation === 'function')
    {

        interpolationFunction = interpolation;
    }

    return interpolationFunction;
};

module.exports = GetInterpolationFunction;
