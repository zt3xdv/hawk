var Class = require('../../utils/Class');
var Components = require('../components');
var GameObject = require('../GameObject');
var NineSliceRender = require('./NineSliceRender');
var Vertex = require('../../geom/mesh/Vertex');

var NineSlice = new Class({

    Extends: GameObject,

    Mixins: [
        Components.AlphaSingle,
        Components.BlendMode,
        Components.Depth,
        Components.GetBounds,
        Components.Mask,
        Components.Origin,
        Components.Pipeline,
        Components.PostPipeline,
        Components.ScrollFactor,
        Components.Texture,
        Components.Transform,
        Components.Visible,
        NineSliceRender
    ],

    initialize:

    function NineSlice (scene, x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight)
    {

        GameObject.call(this, scene, 'NineSlice');

        this._width;

        this._height;

        this._originX = 0.5;

        this._originY = 0.5;

        this._sizeComponent = true;

        this.vertices = [];

        this.leftWidth;

        this.rightWidth;

        this.topHeight;

        this.bottomHeight;

        this.tint = 0xffffff;

        this.tintFill = false;

        var textureFrame = scene.textures.getFrame(texture, frame);

        this.is3Slice = (!topHeight && !bottomHeight);

        if (textureFrame && textureFrame.scale9)
        {

            this.is3Slice = textureFrame.is3Slice;
        }

        var size = this.is3Slice ? 18 : 54;

        for (var i = 0; i < size; i++)
        {
            this.vertices.push(new Vertex());
        }

        this.setPosition(x, y);

        this.setTexture(texture, frame);

        this.setSlices(width, height, leftWidth, rightWidth, topHeight, bottomHeight, false);

        this.updateDisplayOrigin();

        this.initPipeline();
        this.initPostPipeline();
    },

    setSlices: function (width, height, leftWidth, rightWidth, topHeight, bottomHeight, skipScale9)
    {
        if (leftWidth === undefined) { leftWidth = 10; }
        if (rightWidth === undefined) { rightWidth = 10; }
        if (topHeight === undefined) { topHeight = 0; }
        if (bottomHeight === undefined) { bottomHeight = 0; }

        if (skipScale9 === undefined) { skipScale9 = false; }

        var frame = this.frame;

        var sliceChange = false;

        if (this.is3Slice && skipScale9 && topHeight !== 0 && bottomHeight !== 0)
        {
            sliceChange = true;
        }

        if (sliceChange)
        {
            console.warn('Cannot change 9 slice to 3 slice');
        }
        else
        {
            if (frame && frame.scale9 && !skipScale9)
            {
                var data = frame.data.scale9Borders;

                var x = data.x;
                var y = data.y;

                leftWidth = x;
                rightWidth = frame.width - data.w - x;
                topHeight = y;
                bottomHeight = frame.height - data.h - y;

                if (width === undefined)
                {
                    width = frame.width;
                }

                if (height === undefined)
                {
                    height = frame.height;
                }
            }
            else
            {
                if (width === undefined) { width = 256; }
                if (height === undefined) { height = 256; }
            }

            this._width = width;
            this._height = height;

            this.leftWidth = leftWidth;
            this.rightWidth = rightWidth;
            this.topHeight = topHeight;
            this.bottomHeight = bottomHeight;

            if (this.is3Slice)
            {
                height = frame.height;

                this._height = height;
                this.topHeight = height;
                this.bottomHeight = 0;
            }

            this.updateVertices();
            this.updateUVs();
        }

        return this;
    },

    updateUVs: function ()
    {
        var left = this.leftWidth;
        var right = this.rightWidth;
        var top = this.topHeight;
        var bot = this.bottomHeight;

        var width = this.frame.width;
        var height = this.frame.height;

        this.updateQuadUVs(0, 0, 0, left / width, top / height);
        this.updateQuadUVs(6, left / width, 0, 1 - (right / width), top / height);
        this.updateQuadUVs(12, 1 - (right / width), 0, 1, top / height);

        if (!this.is3Slice)
        {
            this.updateQuadUVs(18, 0, top / height, left / width, 1 - (bot / height));
            this.updateQuadUVs(24, left / width, top / height, 1 - right / width, 1 - (bot / height));
            this.updateQuadUVs(30, 1 - right / width, top / height, 1, 1 - (bot / height));
            this.updateQuadUVs(36, 0, 1 - bot / height, left / width, 1);
            this.updateQuadUVs(42, left / width, 1 - bot / height, 1 - right / width, 1);
            this.updateQuadUVs(48, 1 - right / width, 1 - bot / height, 1, 1);
        }
    },

    updateVertices: function ()
    {
        var left = this.leftWidth;
        var right = this.rightWidth;
        var top = this.topHeight;
        var bot = this.bottomHeight;

        var width = this.width;
        var height = this.height;

        this.updateQuad(0, -0.5, 0.5, -0.5 + (left / width), 0.5 - (top / height));
        this.updateQuad(6, -0.5 + (left / width), 0.5, 0.5 - (right / width), 0.5 - (top / height));
        this.updateQuad(12, 0.5 - (right / width), 0.5, 0.5, 0.5 - (top / height));

        if (!this.is3Slice)
        {
            this.updateQuad(18, -0.5, 0.5 - (top / height), -0.5 + (left / width), -0.5 + (bot / height));
            this.updateQuad(24, -0.5 + (left / width), 0.5 - (top / height), 0.5 - (right / width), -0.5 + (bot / height));
            this.updateQuad(30, 0.5 - (right / width), 0.5 - (top / height), 0.5, -0.5 + (bot / height));
            this.updateQuad(36, -0.5, -0.5 + (bot / height), -0.5 + (left / width), -0.5);
            this.updateQuad(42, -0.5 + (left / width), -0.5 + (bot / height), 0.5 - (right / width), -0.5);
            this.updateQuad(48, 0.5 - (right / width), -0.5 + (bot / height), 0.5, -0.5);
        }
    },

    updateQuad: function (offset, x1, y1, x2, y2)
    {
        var width = this.width;
        var height = this.height;
        var originX = this.originX;
        var originY = this.originY;

        var verts = this.vertices;

        verts[offset + 0].resize(x1, y1, width, height, originX, originY);
        verts[offset + 1].resize(x1, y2, width, height, originX, originY);
        verts[offset + 2].resize(x2, y1, width, height, originX, originY);
        verts[offset + 3].resize(x1, y2, width, height, originX, originY);
        verts[offset + 4].resize(x2, y2, width, height, originX, originY);
        verts[offset + 5].resize(x2, y1, width, height, originX, originY);
    },

    updateQuadUVs: function (offset, u1, v1, u2, v2)
    {
        var verts = this.vertices;

        var frame = this.frame;

        var fu1 = frame.u0;
        var fv1 = frame.v0;
        var fu2 = frame.u1;
        var fv2 = frame.v1;

        if (fu1 !== 0 || fu2 !== 1)
        {

            var udiff = fu2 - fu1;
            u1 = fu1 + u1 * udiff;
            u2 = fu1 + u2 * udiff;
        }

        if (fv1 !== 0 || fv2 !== 1)
        {

            var vdiff = fv2 - fv1;
            v1 = fv1 + v1 * vdiff;
            v2 = fv1 + v2 * vdiff;
        }

        verts[offset + 0].setUVs(u1, v1);
        verts[offset + 1].setUVs(u1, v2);
        verts[offset + 2].setUVs(u2, v1);
        verts[offset + 3].setUVs(u1, v2);
        verts[offset + 4].setUVs(u2, v2);
        verts[offset + 5].setUVs(u2, v1);
    },

    clearTint: function ()
    {
        this.setTint(0xffffff);

        return this;
    },

    setTint: function (color)
    {
        if (color === undefined) { color = 0xffffff; }

        this.tint = color;

        this.tintFill = false;

        return this;
    },

    setTintFill: function (color)
    {
        this.setTint(color);

        this.tintFill = true;

        return this;
    },

    isTinted: {

        get: function ()
        {
            return (this.tint !== 0xffffff);
        }

    },

    width: {

        get: function ()
        {
            return this._width;
        },

        set: function (value)
        {
            this._width = Math.max(value, this.leftWidth + this.rightWidth);

            this.updateVertices();
        }

    },

    height: {

        get: function ()
        {
            return this._height;
        },

        set: function (value)
        {
            if (!this.is3Slice)
            {
                this._height = Math.max(value, this.topHeight + this.bottomHeight);

                this.updateVertices();
            }
        }

    },

    displayWidth: {

        get: function ()
        {
            return this.scaleX * this.width;
        },

        set: function (value)
        {
            this.scaleX = value / this.width;
        }

    },

    displayHeight: {

        get: function ()
        {
            return this.scaleY * this.height;
        },

        set: function (value)
        {
            this.scaleY = value / this.height;
        }

    },

    setSize: function (width, height)
    {
        this.width = width;
        this.height = height;

        this.updateDisplayOrigin();

        var input = this.input;

        if (input && !input.customHitArea)
        {
            input.hitArea.width = this.width;
            input.hitArea.height = this.height;
        }

        return this;
    },

    setDisplaySize: function (width, height)
    {
        this.displayWidth = width;
        this.displayHeight = height;

        return this;
    },

    originX: {

        get: function ()
        {
            return this._originX;
        },

        set: function (value)
        {
            this._originX = value;
            this.updateVertices();
        }

    },

    originY: {

        get: function ()
        {
            return this._originY;
        },

        set: function (value)
        {
            this._originY = value;
            this.updateVertices();
        }

    },

    setOrigin: function (x, y)
    {
        if (x === undefined) { x = 0.5; }
        if (y === undefined) { y = x; }

        this._originX = x;
        this._originY = y;

        this.updateVertices();

        return this.updateDisplayOrigin();
    },

    setSizeToFrame: function ()
    {
        if (this.is3Slice)
        {
            var height = this.frame.height;

            this._height = height;
            this.topHeight = height;
            this.bottomHeight = 0;
        }

        this.updateUVs();

        return this;
    },

    preDestroy: function ()
    {
        this.vertices = [];
    }

});

module.exports = NineSlice;
