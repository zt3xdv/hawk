var PropertyValueSet = require('./PropertyValueSet');

var SetScrollFactorX = function (items, value, step, index, direction)
{
    return PropertyValueSet(items, 'scrollFactorX', value, step, index, direction);
};

module.exports = SetScrollFactorX;
