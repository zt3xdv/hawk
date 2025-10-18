var Class = require('../../utils/Class');

var ParticleProcessor = new Class({

    initialize:

    function ParticleProcessor (x, y, active)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (active === undefined) { active = true; }

        this.emitter;

        this.x = x;

        this.y = y;

        this.active = active;
    },

    update: function ()
    {
    },

    destroy: function ()
    {
        this.emitter = null;
    }

});

module.exports = ParticleProcessor;
