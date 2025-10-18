var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');

var Wipe = new Class({

    Extends: Controller,

    initialize:

    function Wipe (gameObject, wipeWidth, direction, axis, reveal)
    {
        if (wipeWidth === undefined) { wipeWidth = 0.1; }
        if (direction === undefined) { direction = 0; }
        if (axis === undefined) { axis = 0; }
        if (reveal === undefined) { reveal = false; }

        Controller.call(this, FX_CONST.WIPE, gameObject);

        this.progress = 0;

        this.wipeWidth = wipeWidth;

        this.direction = direction;

        this.axis = axis;

        this.reveal = reveal;
    }

});

module.exports = Wipe;
