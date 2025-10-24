var Class = require('../utils/Class');
var CubicBezier = require('../math/interpolation/CubicBezierInterpolation');
var Curve = require('./Curve');
var Vector2 = require('../math/Vector2');
var CubicBezierCurve = new Class({
  Extends: Curve,
  initialize: function CubicBezierCurve(p0, p1, p2, p3) {
    Curve.call(this, 'CubicBezierCurve');
    if (Array.isArray(p0)) {
      p3 = new Vector2(p0[6], p0[7]);
      p2 = new Vector2(p0[4], p0[5]);
      p1 = new Vector2(p0[2], p0[3]);
      p0 = new Vector2(p0[0], p0[1]);
    }
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  },
  getStartPoint: function (out) {
    if (out === undefined) {
      out = new Vector2();
    }
    return out.copy(this.p0);
  },
  getResolution: function (divisions) {
    return divisions;
  },
  getPoint: function (t, out) {
    if (out === undefined) {
      out = new Vector2();
    }
    var p0 = this.p0;
    var p1 = this.p1;
    var p2 = this.p2;
    var p3 = this.p3;
    return out.set(
      CubicBezier(t, p0.x, p1.x, p2.x, p3.x),
      CubicBezier(t, p0.y, p1.y, p2.y, p3.y),
    );
  },
  draw: function (graphics, pointsTotal) {
    if (pointsTotal === undefined) {
      pointsTotal = 32;
    }
    var points = this.getPoints(pointsTotal);
    graphics.beginPath();
    graphics.moveTo(this.p0.x, this.p0.y);
    for (var i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();
    return graphics;
  },
  toJSON: function () {
    return {
      type: this.type,
      points: [
        this.p0.x,
        this.p0.y,
        this.p1.x,
        this.p1.y,
        this.p2.x,
        this.p2.y,
        this.p3.x,
        this.p3.y,
      ],
    };
  },
});
CubicBezierCurve.fromJSON = function (data) {
  var points = data.points;
  var p0 = new Vector2(points[0], points[1]);
  var p1 = new Vector2(points[2], points[3]);
  var p2 = new Vector2(points[4], points[5]);
  var p3 = new Vector2(points[6], points[7]);
  return new CubicBezierCurve(p0, p1, p2, p3);
};
module.exports = CubicBezierCurve;
