var SmootherStep = require('../SmootherStep');

var SmootherStepInterpolation = function (t, min, max)
{
    return min + (max - min) * SmootherStep(t, 0, 1);
};

module.exports = SmootherStepInterpolation;
