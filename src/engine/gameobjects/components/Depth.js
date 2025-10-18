var ArrayUtils = require('../../utils/array');

var Depth = {

    _depth: 0,

    depth: {

        get: function ()
        {
            return this._depth;
        },

        set: function (value)
        {
            if (this.displayList)
            {
                this.depthChanged = true;
                this.displayList.queueDepthSort();
            }

            this._depth = value;
        }

    },

    setDepth: function (value)
    {
        if (value === undefined) { value = 0; }

        this.depth = value;

        return this;
    },

    setToTop: function ()
    {
        var list = this.getDisplayList();

        if (list)
        {
            ArrayUtils.BringToTop(list, this);
        }

        return this;
    },

    setToBack: function ()
    {
        var list = this.getDisplayList();

        if (list)
        {
            ArrayUtils.SendToBack(list, this);
        }

        return this;
    },

    setAbove: function (gameObject)
    {
        var list = this.getDisplayList();

        if (list && gameObject)
        {
            ArrayUtils.MoveAbove(list, this, gameObject);
        }

        return this;
    },

    setBelow: function (gameObject)
    {
        var list = this.getDisplayList();

        if (list && gameObject)
        {
            ArrayUtils.MoveBelow(list, this, gameObject);
        }

        return this;
    }

};

module.exports = Depth;
