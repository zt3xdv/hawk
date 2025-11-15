var PropertyValueSet = require('./PropertyValueSet');
var SetOrigin = function (
  items,
  originX,
  originY,
  stepX,
  stepY,
  index,
  direction,
) {
  if (originY === undefined || originY === null) {
    originY = originX;
  }
  PropertyValueSet(items, 'originX', originX, stepX, index, direction);
  PropertyValueSet(items, 'originY', originY, stepY, index, direction);
  items.forEach(function (item) {
    item.updateDisplayOrigin();
  });
  return items;
};
module.exports = SetOrigin;
