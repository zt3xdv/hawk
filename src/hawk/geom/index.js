var CONST = require('./const');
var Extend = require('../utils/object/Extend');
var Geom = {
  Circle: require('./circle'),
  Ellipse: require('./ellipse'),
  Intersects: require('./intersects'),
  Line: require('./line'),
  Mesh: require('./mesh'),
  Point: require('./point'),
  Polygon: require('./polygon'),
  Rectangle: require('./rectangle'),
  Triangle: require('./triangle'),
};
Geom = Extend(false, Geom, CONST);
module.exports = Geom;
