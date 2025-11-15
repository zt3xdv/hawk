var PlaceOnCircle = function (items, circle, startAngle, endAngle) {
  if (startAngle === undefined) {
    startAngle = 0;
  }
  if (endAngle === undefined) {
    endAngle = 6.28;
  }
  var angle = startAngle;
  var angleStep = (endAngle - startAngle) / items.length;
  var cx = circle.x;
  var cy = circle.y;
  var radius = circle.radius;
  for (var i = 0; i < items.length; i++) {
    items[i].x = cx + radius * Math.cos(angle);
    items[i].y = cy + radius * Math.sin(angle);
    angle += angleStep;
  }
  return items;
};
module.exports = PlaceOnCircle;
