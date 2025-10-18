var Class = require('../utils/Class');

var Controller = new Class({

    initialize:

    function Controller (type, gameObject)
    {

        this.type = type;

        this.gameObject = gameObject;

        this.active = true;
    },

    setActive: function (value)
    {
        this.active = value;

        return this;
    },

    destroy: function ()
    {
        this.gameObject = null;
        this.active = false;
    }

});

module.exports = Controller;
