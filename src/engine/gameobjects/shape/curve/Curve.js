var Class = require('../../../utils/Class');
var CurveRender = require('./CurveRender');
var Earcut = require('../../../geom/polygon/Earcut');
var Rectangle = require('../../../geom/rectangle/Rectangle');
var Shape = require('../Shape');

var Curve = new Class({

    Extends: Shape,

    Mixins: [
        CurveRender
    ],

    initialize:

    function Curve (scene, x, y, curve, fillColor, fillAlpha)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }

        Shape.call(this, scene, 'Curve', curve);

        this._smoothness = 32;

        this._curveBounds = new Rectangle();

        this.closePath = false;

        this.setPosition(x, y);

        if (fillColor !== undefined)
        {
            this.setFillStyle(fillColor, fillAlpha);
        }

        this.updateData();
    },

    smoothness: {

        get: function ()
        {
            return this._smoothness;
        },

        set: function (value)
        {
            this._smoothness = value;

            this.updateData();
        }

    },

    setSmoothness: function (value)
    {
        this._smoothness = value;

        return this.updateData();
    },

    updateData: function ()
    {
        var bounds = this._curveBounds;
        var smoothness = this._smoothness;

        this.geom.getBounds(bounds, smoothness);

        this.setSize(bounds.width, bounds.height);
        this.updateDisplayOrigin();

        var path = [];
        var points = this.geom.getPoints(smoothness);

        for (var i = 0; i < points.length; i++)
        {
            path.push(points[i].x, points[i].y);
        }

        path.push(points[0].x, points[0].y);

        this.pathIndexes = Earcut(path);
        this.pathData = path;

        return this;
    }

});

module.exports = Curve;
