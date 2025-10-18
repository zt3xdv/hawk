var PropertyValueSet = require('./PropertyValueSet');

var SetScrollFactor = function (items, scrollFactorX, scrollFactorY, stepX, stepY, index, direction)
{
    if (scrollFactorY === undefined || scrollFactorY === null) { scrollFactorY = scrollFactorX; }

    PropertyValueSet(items, 'scrollFactorX', scrollFactorX, stepX, index, direction);

    return PropertyValueSet(items, 'scrollFactorY', scrollFactorY, stepY, index, direction);
};

module.exports = SetScrollFactor;
