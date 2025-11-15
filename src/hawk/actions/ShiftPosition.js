var Vector2 = require('../math/Vector2');
var ShiftPosition = function (items, x, y, direction, output) {
  if (direction === undefined) {
    direction = 0;
  }
  if (output === undefined) {
    output = new Vector2();
  }
  var px;
  var py;
  var len = items.length;
  if (len === 1) {
    px = items[0].x;
    py = items[0].y;
    items[0].x = x;
    items[0].y = y;
  } else {
    var i = 1;
    var pos = 0;
    if (direction === 0) {
      pos = len - 1;
      i = len - 2;
    }
    px = items[pos].x;
    py = items[pos].y;
    items[pos].x = x;
    items[pos].y = y;
    for (var c = 0; c < len; c++) {
      if (i >= len || i === -1) {
        continue;
      }
      var cur = items[i];
      var cx = cur.x;
      var cy = cur.y;
      cur.x = px;
      cur.y = py;
      px = cx;
      py = cy;
      if (direction === 0) {
        i--;
      } else {
        i++;
      }
    }
  }
  output.x = px;
  output.y = py;
  return output;
};
module.exports = ShiftPosition;
