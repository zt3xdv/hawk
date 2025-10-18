var Class = require('../../utils/Class');
var Contains = require('./Contains');
var GetPoints = require('./GetPoints');
var GEOM_CONST = require('../const');

var Polygon = new Class({

    initialize:

    function Polygon (points)
    {

        this.type = GEOM_CONST.POLYGON;

        this.area = 0;

        this.points = [];

        if (points)
        {
            this.setTo(points);
        }
    },

    contains: function (x, y)
    {
        return Contains(this, x, y);
    },

    setTo: function (points)
    {
        this.area = 0;
        this.points = [];

        if (typeof points === 'string')
        {
            points = points.split(' ');
        }

        if (!Array.isArray(points))
        {
            return this;
        }

        var p;

        for (var i = 0; i < points.length; i++)
        {
            p = { x: 0, y: 0 };

            if (typeof points[i] === 'number' || typeof points[i] === 'string')
            {
                p.x = parseFloat(points[i]);
                p.y = parseFloat(points[i + 1]);
                i++;
            }
            else if (Array.isArray(points[i]))
            {

                p.x = points[i][0];
                p.y = points[i][1];
            }
            else
            {
                p.x = points[i].x;
                p.y = points[i].y;
            }

            this.points.push(p);
        }

        this.calculateArea();

        return this;
    },

    calculateArea: function ()
    {
        if (this.points.length < 3)
        {
            this.area = 0;

            return this.area;
        }

        var sum = 0;
        var p1;
        var p2;

        for (var i = 0; i < this.points.length - 1; i++)
        {
            p1 = this.points[i];
            p2 = this.points[i + 1];

            sum += (p2.x - p1.x) * (p1.y + p2.y);
        }

        p1 = this.points[0];
        p2 = this.points[this.points.length - 1];

        sum += (p1.x - p2.x) * (p2.y + p1.y);

        this.area = -sum * 0.5;

        return this.area;
    },

    getPoints: function (quantity, step, output)
    {
        return GetPoints(this, quantity, step, output);
    }

});

module.exports = Polygon;
