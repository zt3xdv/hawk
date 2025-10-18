var Class = require('../../../utils/Class');
var Shape = require('../Shape');
var GeomLine = require('../../../geom/line/Line');
var LineRender = require('./LineRender');

var Line = new Class({

    Extends: Shape,

    Mixins: [
        LineRender
    ],

    initialize:

    function Line (scene, x, y, x1, y1, x2, y2, strokeColor, strokeAlpha)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (x1 === undefined) { x1 = 0; }
        if (y1 === undefined) { y1 = 0; }
        if (x2 === undefined) { x2 = 128; }
        if (y2 === undefined) { y2 = 0; }

        Shape.call(this, scene, 'Line', new GeomLine(x1, y1, x2, y2));

        var width = Math.max(1, this.geom.right - this.geom.left);
        var height = Math.max(1, this.geom.bottom - this.geom.top);

        this.lineWidth = 1;

        this._startWidth = 1;

        this._endWidth = 1;

        this.setPosition(x, y);
        this.setSize(width, height);

        if (strokeColor !== undefined)
        {
            this.setStrokeStyle(1, strokeColor, strokeAlpha);
        }

        this.updateDisplayOrigin();
    },

    setLineWidth: function (startWidth, endWidth)
    {
        if (endWidth === undefined) { endWidth = startWidth; }

        this._startWidth = startWidth;
        this._endWidth = endWidth;

        this.lineWidth = startWidth;

        return this;
    },

    setTo: function (x1, y1, x2, y2)
    {
        this.geom.setTo(x1, y1, x2, y2);

        return this;
    }

});

module.exports = Line;
