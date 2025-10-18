var Clamp = require('../../math/Clamp');

var _FLAG = 2; 

var AlphaSingle = {

    _alpha: 1,

    clearAlpha: function ()
    {
        return this.setAlpha(1);
    },

    setAlpha: function (value)
    {
        if (value === undefined) { value = 1; }

        this.alpha = value;

        return this;
    },

    alpha: {

        get: function ()
        {
            return this._alpha;
        },

        set: function (value)
        {
            var v = Clamp(value, 0, 1);

            this._alpha = v;

            if (v === 0)
            {
                this.renderFlags &= ~_FLAG;
            }
            else
            {
                this.renderFlags |= _FLAG;
            }
        }

    }

};

module.exports = AlphaSingle;
