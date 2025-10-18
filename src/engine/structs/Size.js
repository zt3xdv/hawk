var Clamp = require('../math/Clamp');
var Class = require('../utils/Class');
var SnapFloor = require('../math/snap/SnapFloor');
var Vector2 = require('../math/Vector2');

var Size = new Class({

    initialize:

    function Size (width, height, aspectMode, parent)
    {
        if (width === undefined) { width = 0; }
        if (height === undefined) { height = width; }
        if (aspectMode === undefined) { aspectMode = 0; }
        if (parent === undefined) { parent = null; }

        this._width = width;

        this._height = height;

        this._parent = parent;

        this.aspectMode = aspectMode;

        this.aspectRatio = (height === 0) ? 1 : width / height;

        this.minWidth = 0;

        this.minHeight = 0;

        this.maxWidth = Number.MAX_VALUE;

        this.maxHeight = Number.MAX_VALUE;

        this.snapTo = new Vector2();
    },

    setAspectMode: function (value)
    {
        if (value === undefined) { value = 0; }

        this.aspectMode = value;

        return this.setSize(this._width, this._height);
    },

    setSnap: function (snapWidth, snapHeight)
    {
        if (snapWidth === undefined) { snapWidth = 0; }
        if (snapHeight === undefined) { snapHeight = snapWidth; }

        this.snapTo.set(snapWidth, snapHeight);

        return this.setSize(this._width, this._height);
    },

    setParent: function (parent)
    {
        this._parent = parent;

        return this.setSize(this._width, this._height);
    },

    setMin: function (width, height)
    {
        if (width === undefined) { width = 0; }
        if (height === undefined) { height = width; }

        this.minWidth = Clamp(width, 0, this.maxWidth);
        this.minHeight = Clamp(height, 0, this.maxHeight);

        return this.setSize(this._width, this._height);
    },

    setMax: function (width, height)
    {
        if (width === undefined) { width = Number.MAX_VALUE; }
        if (height === undefined) { height = width; }

        this.maxWidth = Clamp(width, this.minWidth, Number.MAX_VALUE);
        this.maxHeight = Clamp(height, this.minHeight, Number.MAX_VALUE);

        return this.setSize(this._width, this._height);
    },

    setSize: function (width, height)
    {
        if (width === undefined) { width = 0; }
        if (height === undefined) { height = width; }

        switch (this.aspectMode)
        {
            case Size.NONE:
                this._width = this.getNewWidth(SnapFloor(width, this.snapTo.x));
                this._height = this.getNewHeight(SnapFloor(height, this.snapTo.y));
                this.aspectRatio = (this._height === 0) ? 1 : this._width / this._height;
                break;

            case Size.WIDTH_CONTROLS_HEIGHT:
                this._width = this.getNewWidth(SnapFloor(width, this.snapTo.x));
                this._height = this.getNewHeight(this._width * (1 / this.aspectRatio), false);
                break;

            case Size.HEIGHT_CONTROLS_WIDTH:
                this._height = this.getNewHeight(SnapFloor(height, this.snapTo.y));
                this._width = this.getNewWidth(this._height * this.aspectRatio, false);
                break;

            case Size.FIT:
                this.constrain(width, height, true);
                break;

            case Size.ENVELOP:
                this.constrain(width, height, false);
                break;
        }

        return this;
    },

    setAspectRatio: function (ratio)
    {
        this.aspectRatio = ratio;

        return this.setSize(this._width, this._height);
    },

    resize: function (width, height)
    {
        this._width = this.getNewWidth(SnapFloor(width, this.snapTo.x));
        this._height = this.getNewHeight(SnapFloor(height, this.snapTo.y));
        this.aspectRatio = (this._height === 0) ? 1 : this._width / this._height;

        return this;
    },

    getNewWidth: function (value, checkParent)
    {
        if (checkParent === undefined) { checkParent = true; }

        value = Clamp(value, this.minWidth, this.maxWidth);

        if (checkParent && this._parent && value > this._parent.width)
        {
            value = Math.max(this.minWidth, this._parent.width);
        }

        return value;
    },

    getNewHeight: function (value, checkParent)
    {
        if (checkParent === undefined) { checkParent = true; }

        value = Clamp(value, this.minHeight, this.maxHeight);

        if (checkParent && this._parent && value > this._parent.height)
        {
            value = Math.max(this.minHeight, this._parent.height);
        }

        return value;
    },

    constrain: function (width, height, fit)
    {
        if (width === undefined) { width = 0; }
        if (height === undefined) { height = width; }
        if (fit === undefined) { fit = true; }

        width = this.getNewWidth(width);
        height = this.getNewHeight(height);

        var snap = this.snapTo;
        var newRatio = (height === 0) ? 1 : width / height;

        if ((fit && this.aspectRatio > newRatio) || (!fit && this.aspectRatio < newRatio))
        {

            width = SnapFloor(width, snap.x);

            height = width / this.aspectRatio;

            if (snap.y > 0)
            {
                height = SnapFloor(height, snap.y);

                width = height * this.aspectRatio;
            }
        }
        else if ((fit && this.aspectRatio < newRatio) || (!fit && this.aspectRatio > newRatio))
        {

            height = SnapFloor(height, snap.y);

            width = height * this.aspectRatio;

            if (snap.x > 0)
            {
                width = SnapFloor(width, snap.x);

                height = width * (1 / this.aspectRatio);
            }
        }

        this._width = width;
        this._height = height;

        return this;
    },

    fitTo: function (width, height)
    {
        return this.constrain(width, height, true);
    },

    envelop: function (width, height)
    {
        return this.constrain(width, height, false);
    },

    setWidth: function (value)
    {
        return this.setSize(value, this._height);
    },

    setHeight: function (value)
    {
        return this.setSize(this._width, value);
    },

    toString: function ()
    {
        return '[{ Size (width=' + this._width + ' height=' + this._height + ' aspectRatio=' + this.aspectRatio + ' aspectMode=' + this.aspectMode + ') }]';
    },

    setCSS: function (element)
    {
        if (element && element.style)
        {
            element.style.width = this._width + 'px';
            element.style.height = this._height + 'px';
        }
    },

    copy: function (destination)
    {
        destination.setAspectMode(this.aspectMode);

        destination.aspectRatio = this.aspectRatio;

        return destination.setSize(this.width, this.height);
    },

    destroy: function ()
    {
        this._parent = null;
        this.snapTo = null;
    },

    width: {

        get: function ()
        {
            return this._width;
        },

        set: function (value)
        {
            this.setSize(value, this._height);
        }

    },

    height: {

        get: function ()
        {
            return this._height;
        },

        set: function (value)
        {
            this.setSize(this._width, value);
        }

    }

});

Size.NONE = 0;

Size.WIDTH_CONTROLS_HEIGHT = 1;

Size.HEIGHT_CONTROLS_WIDTH = 2;

Size.FIT = 3;

Size.ENVELOP = 4;

module.exports = Size;
