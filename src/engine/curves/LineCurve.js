var Class = require('../utils/Class');
var Curve = require('./Curve');
var FromPoints = require('../geom/rectangle/FromPoints');
var Rectangle = require('../geom/rectangle/Rectangle');
var Vector2 = require('../math/Vector2');

var LineCurve = new Class({

    Extends: Curve,

    initialize:

    function LineCurve (p0, p1)
    {
        Curve.call(this, 'LineCurve');

        if (Array.isArray(p0))
        {
            p1 = new Vector2(p0[2], p0[3]);
            p0 = new Vector2(p0[0], p0[1]);
        }

        this.p0 = p0;

        this.p1 = p1;

        this.arcLengthDivisions = 1;
    },

    getBounds: function (out)
    {
        if (out === undefined) { out = new Rectangle(); }

        return FromPoints([ this.p0, this.p1 ], out);
    },

    getStartPoint: function (out)
    {
        if (out === undefined) { out = new Vector2(); }

        return out.copy(this.p0);
    },

    getResolution: function (divisions)
    {
        if (divisions === undefined) { divisions = 1; }

        return divisions;
    },

    getPoint: function (t, out)
    {
        if (out === undefined) { out = new Vector2(); }

        if (t === 1)
        {
            return out.copy(this.p1);
        }

        out.copy(this.p1).subtract(this.p0).scale(t).add(this.p0);

        return out;
    },

    getPointAt: function (u, out)
    {
        return this.getPoint(u, out);
    },

    getTangent: function (t, out)
    {
        if (out === undefined) { out = new Vector2(); }

        out.copy(this.p1).subtract(this.p0).normalize();

        return out;
    },

    getUtoTmapping: function (u, distance, divisions)
    {
        var t;

        if (distance)
        {
            var arcLengths = this.getLengths(divisions);
            var lineLength = arcLengths[arcLengths.length - 1];

            var targetLineLength = Math.min(distance, lineLength);

            t = targetLineLength / lineLength;
        }
        else
        {
            t = u;
        }

        return t;
    },

    draw: function (graphics)
    {
        graphics.lineBetween(this.p0.x, this.p0.y, this.p1.x, this.p1.y);

        return graphics;
    },

    toJSON: function ()
    {
        return {
            type: this.type,
            points: [
                this.p0.x, this.p0.y,
                this.p1.x, this.p1.y
            ]
        };
    }

});

LineCurve.fromJSON = function (data)
{
    var points = data.points;

    var p0 = new Vector2(points[0], points[1]);
    var p1 = new Vector2(points[2], points[3]);

    return new LineCurve(p0, p1);
};

module.exports = LineCurve;
