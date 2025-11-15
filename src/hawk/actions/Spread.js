var Spread = function (items, property, min, max, inc) {
  if (inc === undefined) {
    inc = false;
  }
  if (items.length === 0) {
    return items;
  }
  if (items.length === 1) {
    if (inc) {
      items[0][property] += (max + min) / 2;
    } else {
      items[0][property] = (max + min) / 2;
    }
    return items;
  }
  var step = Math.abs(max - min) / (items.length - 1);
  var i;
  if (inc) {
    for (i = 0; i < items.length; i++) {
      items[i][property] += i * step + min;
    }
  } else {
    for (i = 0; i < items.length; i++) {
      items[i][property] = i * step + min;
    }
  }
  return items;
};
module.exports = Spread;
