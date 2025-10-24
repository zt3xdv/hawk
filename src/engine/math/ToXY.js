var Vector2 = require('./Vector2');
var ToXY = function (index, width, height, out) {
  if (out === undefined) {
    out = new Vector2();
  }
  var x = 0;
  var y = 0;
  var total = width * height;
  if (index > 0 && index <= total) {
    if (index > width - 1) {
      y = Math.floor(index / width);
      x = index - y * width;
    } else {
      x = index;
    }
  }
  return out.set(x, y);
};
module.exports = ToXY;
