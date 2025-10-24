var PropertyValueSet = require('./PropertyValueSet');
var SetScrollFactorY = function (items, value, step, index, direction) {
  return PropertyValueSet(
    items,
    'scrollFactorY',
    value,
    step,
    index,
    direction,
  );
};
module.exports = SetScrollFactorY;
