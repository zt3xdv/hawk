var Class = require('../utils/Class');
var FromPoints = require('../geom/rectangle/FromPoints');
var Rectangle = require('../geom/rectangle/Rectangle');
var Vector2 = require('../math/Vector2');
var Curve = new Class({
  initialize: function Curve(type) {
    this.type = type;
    this.defaultDivisions = 5;
    this.arcLengthDivisions = 100;
    this.cacheArcLengths = [];
    this.needsUpdate = true;
    this.active = true;
    this._tmpVec2A = new Vector2();
    this._tmpVec2B = new Vector2();
  },
  draw: function (graphics, pointsTotal) {
    if (pointsTotal === undefined) {
      pointsTotal = 32;
    }
    return graphics.strokePoints(this.getPoints(pointsTotal));
  },
  getBounds: function (out, accuracy) {
    if (!out) {
      out = new Rectangle();
    }
    if (accuracy === undefined) {
      accuracy = 16;
    }
    var len = this.getLength();
    if (accuracy > len) {
      accuracy = len / 2;
    }
    var spaced = Math.max(1, Math.round(len / accuracy));
    return FromPoints(this.getSpacedPoints(spaced), out);
  },
  getDistancePoints: function (distance) {
    var len = this.getLength();
    var spaced = Math.max(1, len / distance);
    return this.getSpacedPoints(spaced);
  },
  getEndPoint: function (out) {
    if (out === undefined) {
      out = new Vector2();
    }
    return this.getPointAt(1, out);
  },
  getLength: function () {
    var lengths = this.getLengths();
    return lengths[lengths.length - 1];
  },
  getLengths: function (divisions) {
    if (divisions === undefined) {
      divisions = this.arcLengthDivisions;
    }
    if (this.cacheArcLengths.length === divisions + 1 && !this.needsUpdate) {
      return this.cacheArcLengths;
    }
    this.needsUpdate = false;
    var cache = [];
    var current;
    var last = this.getPoint(0, this._tmpVec2A);
    var sum = 0;
    cache.push(0);
    for (var p = 1; p <= divisions; p++) {
      current = this.getPoint(p / divisions, this._tmpVec2B);
      sum += current.distance(last);
      cache.push(sum);
      last.copy(current);
    }
    this.cacheArcLengths = cache;
    return cache;
  },
  getPointAt: function (u, out) {
    var t = this.getUtoTmapping(u);
    return this.getPoint(t, out);
  },
  getPoints: function (divisions, stepRate, out) {
    if (out === undefined) {
      out = [];
    }
    if (!divisions) {
      if (!stepRate) {
        divisions = this.defaultDivisions;
      } else {
        divisions = this.getLength() / stepRate;
      }
    }
    for (var d = 0; d <= divisions; d++) {
      out.push(this.getPoint(d / divisions));
    }
    return out;
  },
  getRandomPoint: function (out) {
    if (out === undefined) {
      out = new Vector2();
    }
    return this.getPoint(Math.random(), out);
  },
  getSpacedPoints: function (divisions, stepRate, out) {
    if (out === undefined) {
      out = [];
    }
    if (!divisions) {
      if (!stepRate) {
        divisions = this.defaultDivisions;
      } else {
        divisions = this.getLength() / stepRate;
      }
    }
    for (var d = 0; d <= divisions; d++) {
      var t = this.getUtoTmapping(d / divisions, null, divisions);
      out.push(this.getPoint(t));
    }
    return out;
  },
  getStartPoint: function (out) {
    if (out === undefined) {
      out = new Vector2();
    }
    return this.getPointAt(0, out);
  },
  getTangent: function (t, out) {
    if (out === undefined) {
      out = new Vector2();
    }
    var delta = 0.0001;
    var t1 = t - delta;
    var t2 = t + delta;
    if (t1 < 0) {
      t1 = 0;
    }
    if (t2 > 1) {
      t2 = 1;
    }
    this.getPoint(t1, this._tmpVec2A);
    this.getPoint(t2, out);
    return out.subtract(this._tmpVec2A).normalize();
  },
  getTangentAt: function (u, out) {
    var t = this.getUtoTmapping(u);
    return this.getTangent(t, out);
  },
  getTFromDistance: function (distance, divisions) {
    if (distance <= 0) {
      return 0;
    }
    return this.getUtoTmapping(0, distance, divisions);
  },
  getUtoTmapping: function (u, distance, divisions) {
    var arcLengths = this.getLengths(divisions);
    var i = 0;
    var il = arcLengths.length;
    var targetArcLength;
    if (distance) {
      targetArcLength = Math.min(distance, arcLengths[il - 1]);
    } else {
      targetArcLength = u * arcLengths[il - 1];
    }
    var low = 0;
    var high = il - 1;
    var comparison;
    while (low <= high) {
      i = Math.floor(low + (high - low) / 2);
      comparison = arcLengths[i] - targetArcLength;
      if (comparison < 0) {
        low = i + 1;
      } else if (comparison > 0) {
        high = i - 1;
      } else {
        high = i;
        break;
      }
    }
    i = high;
    if (arcLengths[i] === targetArcLength) {
      return i / (il - 1);
    }
    var lengthBefore = arcLengths[i];
    var lengthAfter = arcLengths[i + 1];
    var segmentLength = lengthAfter - lengthBefore;
    var segmentFraction = (targetArcLength - lengthBefore) / segmentLength;
    return (i + segmentFraction) / (il - 1);
  },
  updateArcLengths: function () {
    this.needsUpdate = true;
    this.getLengths();
  },
});
module.exports = Curve;
