var Class = require('../../../utils/Class');
var IsoTriangleRender = require('./IsoTriangleRender');
var Shape = require('../Shape');

var IsoTriangle = new Class({

    Extends: Shape,

    Mixins: [
        IsoTriangleRender
    ],

    initialize:

    function IsoTriangle (scene, x, y, size, height, reversed, fillTop, fillLeft, fillRight)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (size === undefined) { size = 48; }
        if (height === undefined) { height = 32; }
        if (reversed === undefined) { reversed = false; }
        if (fillTop === undefined) { fillTop = 0xeeeeee; }
        if (fillLeft === undefined) { fillLeft = 0x999999; }
        if (fillRight === undefined) { fillRight = 0xcccccc; }

        Shape.call(this, scene, 'IsoTriangle', null);

        this.projection = 4;

        this.fillTop = fillTop;

        this.fillLeft = fillLeft;

        this.fillRight = fillRight;

        this.showTop = true;

        this.showLeft = true;

        this.showRight = true;

        this.isReversed = reversed;

        this.isFilled = true;

        this.setPosition(x, y);
        this.setSize(size, height);

        this.updateDisplayOrigin();
    },

    setProjection: function (value)
    {
        this.projection = value;

        return this;
    },

    setReversed: function (reversed)
    {
        this.isReversed = reversed;

        return this;
    },

    setFaces: function (showTop, showLeft, showRight)
    {
        if (showTop === undefined) { showTop = true; }
        if (showLeft === undefined) { showLeft = true; }
        if (showRight === undefined) { showRight = true; }

        this.showTop = showTop;
        this.showLeft = showLeft;
        this.showRight = showRight;

        return this;
    },

    setFillStyle: function (fillTop, fillLeft, fillRight)
    {
        this.fillTop = fillTop;
        this.fillLeft = fillLeft;
        this.fillRight = fillRight;

        this.isFilled = true;

        return this;
    }

});

module.exports = IsoTriangle;
