var Class = require('../../../utils/Class');
var Shape = require('../Shape');
var GridRender = require('./GridRender');

var Grid = new Class({

    Extends: Shape,

    Mixins: [
        GridRender
    ],

    initialize:

    function Grid (scene, x, y, width, height, cellWidth, cellHeight, fillColor, fillAlpha, outlineFillColor, outlineFillAlpha)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (width === undefined) { width = 128; }
        if (height === undefined) { height = 128; }
        if (cellWidth === undefined) { cellWidth = 32; }
        if (cellHeight === undefined) { cellHeight = 32; }

        Shape.call(this, scene, 'Grid', null);

        this.cellWidth = cellWidth;

        this.cellHeight = cellHeight;

        this.showCells = true;

        this.outlineFillColor = 0;

        this.outlineFillAlpha = 0;

        this.showOutline = true;

        this.showAltCells = false;

        this.altFillColor;

        this.altFillAlpha;

        this.setPosition(x, y);
        this.setSize(width, height);

        this.setFillStyle(fillColor, fillAlpha);

        if (outlineFillColor !== undefined)
        {
            this.setOutlineStyle(outlineFillColor, outlineFillAlpha);
        }

        this.updateDisplayOrigin();
    },

    setFillStyle: function (fillColor, fillAlpha)
    {
        if (fillAlpha === undefined) { fillAlpha = 1; }

        if (fillColor === undefined)
        {
            this.showCells = false;
        }
        else
        {
            this.fillColor = fillColor;
            this.fillAlpha = fillAlpha;
            this.showCells = true;
        }

        return this;
    },

    setAltFillStyle: function (fillColor, fillAlpha)
    {
        if (fillAlpha === undefined) { fillAlpha = 1; }

        if (fillColor === undefined)
        {
            this.showAltCells = false;
        }
        else
        {
            this.altFillColor = fillColor;
            this.altFillAlpha = fillAlpha;
            this.showAltCells = true;
        }

        return this;
    },

    setOutlineStyle: function (fillColor, fillAlpha)
    {
        if (fillAlpha === undefined) { fillAlpha = 1; }

        if (fillColor === undefined)
        {
            this.showOutline = false;
        }
        else
        {
            this.outlineFillColor = fillColor;
            this.outlineFillAlpha = fillAlpha;
            this.showOutline = true;
        }

        return this;
    }

});

module.exports = Grid;
