var Class = require('../../../utils/Class');
var Clamp = require('../../../math/Clamp');
var Components = require('../../components');
var GameObject = require('../../GameObject');
var GetBitmapTextSize = require('../GetBitmapTextSize');
var ParseFromAtlas = require('../ParseFromAtlas');
var ParseXMLBitmapFont = require('../ParseXMLBitmapFont');
var Rectangle = require('../../../geom/rectangle/Rectangle');
var Render = require('./BitmapTextRender');

var BitmapText = new Class({

    Extends: GameObject,

    Mixins: [
        Components.Alpha,
        Components.BlendMode,
        Components.Depth,
        Components.GetBounds,
        Components.Mask,
        Components.Origin,
        Components.Pipeline,
        Components.PostPipeline,
        Components.ScrollFactor,
        Components.Texture,
        Components.Tint,
        Components.Transform,
        Components.Visible,
        Render
    ],

    initialize:

    function BitmapText (scene, x, y, font, text, size, align)
    {
        if (text === undefined) { text = ''; }
        if (align === undefined) { align = 0; }

        GameObject.call(this, scene, 'BitmapText');

        this.font = font;

        var entry = this.scene.sys.cache.bitmapFont.get(font);

        if (!entry)
        {
            throw new Error('Invalid BitmapText key: ' + font);
        }

        this.fontData = entry.data;

        this._text = '';

        this._fontSize = size || this.fontData.size;

        this._letterSpacing = 0;

        this._lineSpacing = 0;

        this._align = align;

        this._bounds = GetBitmapTextSize();

        this._dirty = true;

        this._maxWidth = 0;

        this.wordWrapCharCode = 32;

        this.charColors = [];

        this.dropShadowX = 0;

        this.dropShadowY = 0;

        this.dropShadowColor = 0x000000;

        this.dropShadowAlpha = 0.5;

        this.fromAtlas = entry.fromAtlas;

        this.setTexture(entry.texture, entry.frame);
        this.setPosition(x, y);
        this.setOrigin(0, 0);
        this.initPipeline();
        this.initPostPipeline();

        this.setText(text);
    },

    setLeftAlign: function ()
    {
        this._align = BitmapText.ALIGN_LEFT;

        this._dirty = true;

        return this;
    },

    setCenterAlign: function ()
    {
        this._align = BitmapText.ALIGN_CENTER;

        this._dirty = true;

        return this;
    },

    setRightAlign: function ()
    {
        this._align = BitmapText.ALIGN_RIGHT;

        this._dirty = true;

        return this;
    },

    setFontSize: function (size)
    {
        this._fontSize = size;

        this._dirty = true;

        return this;
    },

    setLetterSpacing: function (spacing)
    {
        if (spacing === undefined) { spacing = 0; }

        this._letterSpacing = spacing;

        this._dirty = true;

        return this;
    },

    setLineSpacing: function (spacing)
    {
        if (spacing === undefined) { spacing = 0; }

        this.lineSpacing = spacing;

        return this;
    },

    setText: function (value)
    {
        if (!value && value !== 0)
        {
            value = '';
        }

        if (Array.isArray(value))
        {
            value = value.join('\n');
        }

        if (value !== this.text)
        {
            this._text = value.toString();

            this._dirty = true;

            this.updateDisplayOrigin();
        }

        return this;
    },

    setDropShadow: function (x, y, color, alpha)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (color === undefined) { color = 0x000000; }
        if (alpha === undefined) { alpha = 0.5; }

        this.dropShadowX = x;
        this.dropShadowY = y;
        this.dropShadowColor = color;
        this.dropShadowAlpha = alpha;

        return this;
    },

    setCharacterTint: function (start, length, tintFill, topLeft, topRight, bottomLeft, bottomRight)
    {
        if (start === undefined) { start = 0; }
        if (length === undefined) { length = 1; }
        if (tintFill === undefined) { tintFill = false; }
        if (topLeft === undefined) { topLeft = -1; }

        if (topRight === undefined)
        {
            topRight = topLeft;
            bottomLeft = topLeft;
            bottomRight = topLeft;
        }

        var len = this.text.length;

        if (length === -1)
        {
            length = len;
        }

        if (start < 0)
        {
            start = len + start;
        }

        start = Clamp(start, 0, len - 1);

        var end = Clamp(start + length, start, len);

        var charColors = this.charColors;

        for (var i = start; i < end; i++)
        {
            var color = charColors[i];

            if (topLeft === -1)
            {
                charColors[i] = null;
            }
            else
            {
                var tintEffect = (tintFill) ? 1 : 0;

                if (color)
                {
                    color.tintEffect = tintEffect;
                    color.tintTL = topLeft;
                    color.tintTR = topRight;
                    color.tintBL = bottomLeft;
                    color.tintBR = bottomRight;
                }
                else
                {
                    charColors[i] = {
                        tintEffect: tintEffect,
                        tintTL: topLeft,
                        tintTR: topRight,
                        tintBL: bottomLeft,
                        tintBR: bottomRight
                    };
                }
            }
        }

        return this;
    },

    setWordTint: function (word, count, tintFill, topLeft, topRight, bottomLeft, bottomRight)
    {
        if (count === undefined) { count = 1; }

        var bounds = this.getTextBounds();

        var words = bounds.words;

        var wordIsNumber = (typeof(word) === 'number');

        var total = 0;

        for (var i = 0; i < words.length; i++)
        {
            var lineword = words[i];

            if ((wordIsNumber && i === word) || (!wordIsNumber && lineword.word === word))
            {
                this.setCharacterTint(lineword.i, lineword.word.length, tintFill, topLeft, topRight, bottomLeft, bottomRight);

                total++;

                if (total === count)
                {
                    return this;
                }
            }
        }

        return this;
    },

    getTextBounds: function (round)
    {

        var bounds = this._bounds;

        if (this._dirty || round || this.scaleX !== bounds.scaleX || this.scaleY !== bounds.scaleY)
        {
            GetBitmapTextSize(this, round, true, bounds);

            this._dirty = false;
        }

        return bounds;
    },

    getCharacterAt: function (x, y, camera)
    {
        var point = this.getLocalPoint(x, y, null, camera);

        var bounds = this.getTextBounds();

        var chars = bounds.characters;

        var tempRect = new Rectangle();

        for (var i = 0; i < chars.length; i++)
        {
            var char = chars[i];

            tempRect.setTo(char.x, char.t, char.r - char.x, char.b);

            if (tempRect.contains(point.x, point.y))
            {
                return char;
            }
        }

        return null;
    },

    updateDisplayOrigin: function ()
    {
        this._dirty = true;

        this.getTextBounds(false);

        return this;
    },

    setFont: function (key, size, align)
    {
        if (size === undefined) { size = this._fontSize; }
        if (align === undefined) { align = this._align; }

        var entry = this.scene.sys.cache.bitmapFont.get(key);

        if (entry)
        {
            this.font = key;
            this.fontData = entry.data;
            this._fontSize = size;
            this._align = align;
            this.fromAtlas = entry.fromAtlas === true;

            this.setTexture(entry.texture, entry.frame);

            GetBitmapTextSize(this, false, true, this._bounds);
        }

        return this;
    },

    setMaxWidth: function (value, wordWrapCharCode)
    {
        this._maxWidth = value;

        this._dirty = true;

        if (wordWrapCharCode !== undefined)
        {
            this.wordWrapCharCode = wordWrapCharCode;
        }

        return this;
    },

    setDisplaySize: function (displayWidth, displayHeight)
    {
        this.setScale(1, 1);

        this.getTextBounds(false);

        var scaleX = displayWidth / this.width;

        var scaleY = displayHeight / this.height;

        this.setScale(scaleX, scaleY);

        return this;
    },

    align: {

        set: function (value)
        {
            this._align = value;
            this._dirty = true;
        },

        get: function ()
        {
            return this._align;
        }

    },

    text: {

        set: function (value)
        {
            this.setText(value);
        },

        get: function ()
        {
            return this._text;
        }

    },

    fontSize: {

        set: function (value)
        {
            this._fontSize = value;
            this._dirty = true;
        },

        get: function ()
        {
            return this._fontSize;
        }

    },

    letterSpacing: {

        set: function (value)
        {
            this._letterSpacing = value;
            this._dirty = true;
        },

        get: function ()
        {
            return this._letterSpacing;
        }

    },

    lineSpacing: {

        set: function (value)
        {
            this._lineSpacing = value;
            this._dirty = true;
        },

        get: function ()
        {
            return this._lineSpacing;
        }

    },

    maxWidth: {

        set: function (value)
        {
            this._maxWidth = value;
            this._dirty = true;
        },

        get: function ()
        {
            return this._maxWidth;
        }

    },

    width: {

        get: function ()
        {
            this.getTextBounds(false);

            return this._bounds.global.width;
        }

    },

    height: {

        get: function ()
        {
            this.getTextBounds(false);

            return this._bounds.global.height;
        }

    },

    displayWidth: {

        set: function(value)
        {
            this.setScaleX(1);

            this.getTextBounds(false);

            var scale = value / this.width;

            this.setScaleX(scale);
        },

        get: function ()
        {
            return this.width;
        }

    },

    displayHeight: {

        set: function(value)
        {
            this.setScaleY(1);

            this.getTextBounds(false);

            var scale = value / this.height;

            this.setScaleY(scale);
        },

        get: function ()
        {
            return this.height;
        }

    },

    toJSON: function ()
    {
        var out = Components.ToJSON(this);

        var data = {
            font: this.font,
            text: this.text,
            fontSize: this.fontSize,
            letterSpacing: this.letterSpacing,
            lineSpacing: this.lineSpacing,
            align: this.align
        };

        out.data = data;

        return out;
    },

    preDestroy: function ()
    {
        this.charColors.length = 0;
        this._bounds = null;
        this.fontData = null;
    }

});

BitmapText.ALIGN_LEFT = 0;

BitmapText.ALIGN_CENTER = 1;

BitmapText.ALIGN_RIGHT = 2;

BitmapText.ParseFromAtlas = ParseFromAtlas;

BitmapText.ParseXMLBitmapFont = ParseXMLBitmapFont;

module.exports = BitmapText;
