var GetPoints = require('../geom/line/GetPoints');
var GetEasedPoints = require('../geom/line/GetEasedPoints');
var PlaceOnLine = function (items, line, ease) {
  var points;
  if (ease) {
    points = GetEasedPoints(line, ease, items.length);
  } else {
    points = GetPoints(line, items.length);
  }
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var point = points[i];
    item.x = point.x;
    item.y = point.y;
  }
  return items;
};
module.exports = PlaceOnLine;
