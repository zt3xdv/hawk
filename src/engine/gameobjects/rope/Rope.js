var AnimationState = require('../../animations/AnimationState');
var Class = require('../../utils/Class');
var Components = require('../components');
var GameObject = require('../GameObject');
var PIPELINE_CONST = require('../../renderer/webgl/pipelines/const');
var RopeRender = require('./RopeRender');
var Vector2 = require('../../math/Vector2');

var Rope = new Class({

    Extends: GameObject,

    Mixins: [
        Components.AlphaSingle,
        Components.BlendMode,
        Components.Depth,
        Components.Flip,
        Components.Mask,
        Components.Pipeline,
        Components.PostPipeline,
        Components.Size,
        Components.Texture,
        Components.Transform,
        Components.Visible,
        Components.ScrollFactor,
        RopeRender
    ],

    initialize:

    function Rope (scene, x, y, texture, frame, points, horizontal, colors, alphas)
    {
        if (texture === undefined) { texture = '__DEFAULT'; }
        if (points === undefined) { points = 2; }
        if (horizontal === undefined) { horizontal = true; }

        GameObject.call(this, scene, 'Rope');

        this.anims = new AnimationState(this);

        this.points = points;

        this.vertices;

        this.uv;

        this.colors;

        this.alphas;

        this.tintFill = (texture === '__DEFAULT') ? true : false;

        this.dirty = false;

        this.horizontal = horizontal;

        this._flipX = false;

        this._flipY = false;

        this._perp = new Vector2();

        this.debugCallback = null;

        this.debugGraphic = null;

        this.setTexture(texture, frame);
        this.setPosition(x, y);
        this.setSizeToFrame();
        this.initPipeline(PIPELINE_CONST.ROPE_PIPELINE);
        this.initPostPipeline();

        if (Array.isArray(points))
        {
            this.resizeArrays(points.length);
        }

        this.setPoints(points, colors, alphas);

        this.updateVertices();
    },

    addedToScene: function ()
    {
        this.scene.sys.updateList.add(this);
    },

    removedFromScene: function ()
    {
        this.scene.sys.updateList.remove(this);
    },

    preUpdate: function (time, delta)
    {
        var prevFrame = this.anims.currentFrame;

        this.anims.update(time, delta);

        if (this.anims.currentFrame !== prevFrame)
        {
            this.updateUVs();
            this.updateVertices();
        }
    },

    play: function (key, ignoreIfPlaying, startFrame)
    {
        this.anims.play(key, ignoreIfPlaying, startFrame);

        return this;
    },

    setDirty: function ()
    {
        this.dirty = true;

        return this;
    },

    setHorizontal: function (points, colors, alphas)
    {
        if (points === undefined) { points = this.points.length; }

        if (this.horizontal)
        {
            return this;
        }

        this.horizontal = true;

        return this.setPoints(points, colors, alphas);
    },

    setVertical: function (points, colors, alphas)
    {
        if (points === undefined) { points = this.points.length; }

        if (!this.horizontal)
        {
            return this;
        }

        this.horizontal = false;

        return this.setPoints(points, colors, alphas);
    },

    setTintFill: function (value)
    {
        if (value === undefined) { value = false; }

        this.tintFill = value;

        return this;
    },

    setAlphas: function (alphas, bottomAlpha)
    {
        var total = this.points.length;

        if (total < 1)
        {
            return this;
        }

        var currentAlphas = this.alphas;

        if (alphas === undefined)
        {
            alphas = [ 1 ];
        }
        else if (!Array.isArray(alphas) && bottomAlpha === undefined)
        {
            alphas = [ alphas ];
        }

        var i;
        var index = 0;

        if (bottomAlpha !== undefined)
        {

            for (i = 0; i < total; i++)
            {
                index = i * 2;

                currentAlphas[index] = alphas;
                currentAlphas[index + 1] = bottomAlpha;
            }
        }
        else if (alphas.length === total)
        {

            for (i = 0; i < total; i++)
            {
                index = i * 2;

                currentAlphas[index] = alphas[i];
                currentAlphas[index + 1] = alphas[i];
            }
        }
        else
        {
            var prevAlpha = alphas[0];

            for (i = 0; i < total; i++)
            {
                index = i * 2;

                if (alphas.length > index)
                {
                    prevAlpha = alphas[index];
                }

                currentAlphas[index] = prevAlpha;

                if (alphas.length > index + 1)
                {
                    prevAlpha = alphas[index + 1];
                }

                currentAlphas[index + 1] = prevAlpha;
            }
        }

        return this;

    },

    setColors: function (colors)
    {
        var total = this.points.length;

        if (total < 1)
        {
            return this;
        }

        var currentColors = this.colors;

        if (colors === undefined)
        {
            colors = [ 0xffffff ];
        }
        else if (!Array.isArray(colors))
        {
            colors = [ colors ];
        }

        var i;
        var index = 0;

        if (colors.length === total)
        {

            for (i = 0; i < total; i++)
            {
                index = i * 2;

                currentColors[index] = colors[i];
                currentColors[index + 1] = colors[i];
            }
        }
        else
        {
            var prevColor = colors[0];

            for (i = 0; i < total; i++)
            {
                index = i * 2;

                if (colors.length > index)
                {
                    prevColor = colors[index];
                }

                currentColors[index] = prevColor;

                if (colors.length > index + 1)
                {
                    prevColor = colors[index + 1];
                }

                currentColors[index + 1] = prevColor;
            }
        }

        return this;
    },

    setPoints: function (points, colors, alphas)
    {
        if (points === undefined) { points = 2; }

        if (typeof points === 'number')
        {

            var segments = points;

            if (segments < 2)
            {
                segments = 2;
            }

            points = [];

            var s;
            var frameSegment;
            var offset;

            if (this.horizontal)
            {
                offset = -(this.frame.halfWidth);
                frameSegment = this.frame.width / (segments - 1);

                for (s = 0; s < segments; s++)
                {
                    points.push({ x: offset + s * frameSegment, y: 0 });
                }
            }
            else
            {
                offset = -(this.frame.halfHeight);
                frameSegment = this.frame.height / (segments - 1);

                for (s = 0; s < segments; s++)
                {
                    points.push({ x: 0, y: offset + s * frameSegment });
                }
            }
        }

        var total = points.length;
        var currentTotal = this.points.length;

        if (total < 1)
        {
            console.warn('Rope: Not enough points given');

            return this;
        }
        else if (total === 1)
        {
            points.unshift({ x: 0, y: 0 });
            total++;
        }

        if (currentTotal !== total)
        {
            this.resizeArrays(total);
        }

        this.dirty = true;

        this.points = points;

        this.updateUVs();

        if (colors !== undefined && colors !== null)
        {
            this.setColors(colors);
        }

        if (alphas !== undefined && alphas !== null)
        {
            this.setAlphas(alphas);
        }

        return this;
    },

    updateUVs: function ()
    {
        var currentUVs = this.uv;
        var total = this.points.length;

        var u0 = this.frame.u0;
        var v0 = this.frame.v0;
        var u1 = this.frame.u1;
        var v1 = this.frame.v1;

        var partH = (u1 - u0) / (total - 1);
        var partV = (v1 - v0) / (total - 1);

        for (var i = 0; i < total; i++)
        {
            var index = i * 4;

            var uv0;
            var uv1;
            var uv2;
            var uv3;

            if (this.horizontal)
            {
                if (this._flipX)
                {
                    uv0 = u1 - (i * partH);
                    uv2 = u1 - (i * partH);
                }
                else
                {
                    uv0 = u0 + (i * partH);
                    uv2 = u0 + (i * partH);
                }

                if (this._flipY)
                {
                    uv1 = v1;
                    uv3 = v0;
                }
                else
                {
                    uv1 = v0;
                    uv3 = v1;
                }
            }
            else
            {
                if (this._flipX)
                {
                    uv0 = u0;
                    uv2 = u1;
                }
                else
                {
                    uv0 = u1;
                    uv2 = u0;
                }

                if (this._flipY)
                {
                    uv1 = v1 - (i * partV);
                    uv3 = v1 - (i * partV);
                }
                else
                {
                    uv1 = v0 + (i * partV);
                    uv3 = v0 + (i * partV);
                }
            }

            currentUVs[index + 0] = uv0;
            currentUVs[index + 1] = uv1;
            currentUVs[index + 2] = uv2;
            currentUVs[index + 3] = uv3;
        }

        return this;
    },

    resizeArrays: function (newSize)
    {
        var colors = this.colors;
        var alphas = this.alphas;

        this.vertices = new Float32Array(newSize * 4);
        this.uv = new Float32Array(newSize * 4);

        colors = new Uint32Array(newSize * 2);
        alphas = new Float32Array(newSize * 2);

        for (var i = 0; i < newSize * 2; i++)
        {
            colors[i] = 0xffffff;
            alphas[i] = 1;
        }

        this.colors = colors;
        this.alphas = alphas;

        this.dirty = true;

        return this;
    },

    updateVertices: function ()
    {
        var perp = this._perp;
        var points = this.points;
        var vertices = this.vertices;

        var total = points.length;

        this.dirty = false;

        if (total < 1)
        {
            return;
        }

        var nextPoint;
        var lastPoint = points[0];

        var frameSize = (this.horizontal) ? this.frame.halfHeight : this.frame.halfWidth;

        for (var i = 0; i < total; i++)
        {
            var point = points[i];
            var index = i * 4;

            if (i < total - 1)
            {
                nextPoint = points[i + 1];
            }
            else
            {
                nextPoint = point;
            }

            perp.x = nextPoint.y - lastPoint.y;
            perp.y = -(nextPoint.x - lastPoint.x);

            var perpLength = perp.length();

            perp.x /= perpLength;
            perp.y /= perpLength;

            perp.x *= frameSize;
            perp.y *= frameSize;

            vertices[index] = point.x + perp.x;
            vertices[index + 1] = point.y + perp.y;
            vertices[index + 2] = point.x - perp.x;
            vertices[index + 3] = point.y - perp.y;

            lastPoint = point;
        }

        return this;
    },

    setDebug: function (graphic, callback)
    {
        this.debugGraphic = graphic;

        if (!graphic && !callback)
        {
            this.debugCallback = null;
        }
        else if (!callback)
        {
            this.debugCallback = this.renderDebugVerts;
        }
        else
        {
            this.debugCallback = callback;
        }

        return this;
    },

    renderDebugVerts: function (src, meshLength, verts)
    {
        var graphic = src.debugGraphic;

        var px0 = verts[0];
        var py0 = verts[1];
        var px1 = verts[2];
        var py1 = verts[3];

        graphic.lineBetween(px0, py0, px1, py1);

        for (var i = 4; i < meshLength; i += 4)
        {
            var x0 = verts[i + 0];
            var y0 = verts[i + 1];
            var x1 = verts[i + 2];
            var y1 = verts[i + 3];

            graphic.lineBetween(px0, py0, x0, y0);
            graphic.lineBetween(px1, py1, x1, y1);
            graphic.lineBetween(px1, py1, x0, y0);
            graphic.lineBetween(x0, y0, x1, y1);

            px0 = x0;
            py0 = y0;
            px1 = x1;
            py1 = y1;
        }
    },

    preDestroy: function ()
    {
        this.anims.destroy();

        this.anims = undefined;

        this.points = null;
        this.vertices = null;
        this.uv = null;
        this.colors = null;
        this.alphas = null;

        this.debugCallback = null;
        this.debugGraphic = null;
    },

    flipX: {

        get: function ()
        {
            return this._flipX;
        },

        set: function (value)
        {
            this._flipX = value;

            return this.updateUVs();
        }

    },

    flipY: {

        get: function ()
        {
            return this._flipY;
        },

        set: function (value)
        {
            this._flipY = value;

            return this.updateUVs();
        }

    }

});

module.exports = Rope;
