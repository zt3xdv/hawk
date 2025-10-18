var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');

var Pixelate = new Class({

    Extends: Controller,

    initialize:

    function Pixelate (gameObject, amount)
    {
        if (amount === undefined) { amount = 1; }

        Controller.call(this, FX_CONST.PIXELATE, gameObject);

        this.amount = amount;
    }

});

module.exports = Pixelate;
