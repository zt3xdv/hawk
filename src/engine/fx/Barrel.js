var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');

var Barrel = new Class({

    Extends: Controller,

    initialize:

    function Barrel (gameObject, amount)
    {
        if (amount === undefined) { amount = 1; }

        Controller.call(this, FX_CONST.BARREL, gameObject);

        this.amount = amount;
    }

});

module.exports = Barrel;
