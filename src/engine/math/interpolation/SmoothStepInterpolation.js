var SmoothStep = require('../SmoothStep');

var SmoothStepInterpolation = function (t, min, max)
{
    return min + (max - min) * SmoothStep(t, 0, 1);
};

module.exports = SmoothStepInterpolation;
