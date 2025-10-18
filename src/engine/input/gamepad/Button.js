var Class = require('../../utils/Class');
var Events = require('./events');

var Button = new Class({

    initialize:

    function Button (pad, index)
    {

        this.pad = pad;

        this.events = pad.manager;

        this.index = index;

        this.value = 0;

        this.threshold = 1;

        this.pressed = false;
    },

    update: function (value)
    {
        this.value = value;

        var pad = this.pad;
        var index = this.index;

        if (value >= this.threshold)
        {
            if (!this.pressed)
            {
                this.pressed = true;
                this.events.emit(Events.BUTTON_DOWN, pad, this, value);
                this.pad.emit(Events.GAMEPAD_BUTTON_DOWN, index, value, this);
            }
        }
        else if (this.pressed)
        {
            this.pressed = false;
            this.events.emit(Events.BUTTON_UP, pad, this, value);
            this.pad.emit(Events.GAMEPAD_BUTTON_UP, index, value, this);
        }
    },

    destroy: function ()
    {
        this.pad = null;
        this.events = null;
    }

});

module.exports = Button;
