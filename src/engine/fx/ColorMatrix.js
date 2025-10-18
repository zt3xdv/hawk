var Class = require('../utils/Class');
var BaseColorMatrix = require('../display/ColorMatrix');
var FX_CONST = require('./const');

var ColorMatrix = new Class({

    Extends: BaseColorMatrix,

    initialize:

    function ColorMatrix (gameObject)
    {
        BaseColorMatrix.call(this);

        this.type = FX_CONST.COLOR_MATRIX;

        this.gameObject = gameObject;

        this.active = true;
    },

    destroy: function ()
    {
        this.gameObject = null;
        this._matrix = null;
        this._data = null;
    }

});

module.exports = ColorMatrix;
