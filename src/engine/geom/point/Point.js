var Class = require('../../utils/Class');
var GEOM_CONST = require('../const');

var Point = new Class({

    initialize:

    function Point (x, y)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = x; }

        this.type = GEOM_CONST.POINT;

        this.x = x;

        this.y = y;
    },

    setTo: function (x, y)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = x; }

        this.x = x;
        this.y = y;

        return this;
    }

});

module.exports = Point;
