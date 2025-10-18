var Class = require('../../utils/Class');
var DynamicTexture = require('../../textures/DynamicTexture');
var Image = require('../image/Image');

var RenderTexture = new Class({

    Extends: Image,

    initialize:

    function RenderTexture (scene, x, y, width, height, forceEven)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (width === undefined) { width = 32; }
        if (height === undefined) { height = 32; }
        if (forceEven === undefined) { forceEven = true; }

        var dynamicTexture = new DynamicTexture(scene.sys.textures, '', width, height, forceEven);

        Image.call(this, scene, x, y, dynamicTexture);

        this.type = 'RenderTexture';

        this.camera = this.texture.camera;

        this._saved = false;
    },

    setSize: function (width, height)
    {
        this.width = width;
        this.height = height;

        this.updateDisplayOrigin();

        var input = this.input;

        if (input && !input.customHitArea)
        {
            input.hitArea.width = width;
            input.hitArea.height = height;
        }

        return this;
    },

    resize: function (width, height, forceEven)
    {
        this.texture.setSize(width, height, forceEven);

        this.setSize(this.texture.width, this.texture.height);

        return this;
    },

    saveTexture: function (key)
    {
        var texture = this.texture;

        texture.key = key;

        if (texture.manager.addDynamicTexture(texture))
        {
            this._saved = true;
        }

        return texture;
    },

    fill: function (rgb, alpha, x, y, width, height)
    {
        this.texture.fill(rgb, alpha, x, y, width, height);

        return this;
    },

    clear: function ()
    {
        this.texture.clear();

        return this;
    },

    stamp: function (key, frame, x, y, config)
    {
        this.texture.stamp(key, frame, x, y, config);

        return this;
    },

    erase: function (entries, x, y)
    {
        this.texture.erase(entries, x, y);

        return this;
    },

    draw: function (entries, x, y, alpha, tint)
    {
        this.texture.draw(entries, x, y, alpha, tint);

        return this;
    },

    drawFrame: function (key, frame, x, y, alpha, tint)
    {
        this.texture.drawFrame(key, frame, x, y, alpha, tint);

        return this;
    },

    repeat: function (key, frame, x, y, width, height, alpha, tint, skipBatch)
    {
        this.texture.repeat(key, frame, x, y, width, height, alpha, tint, skipBatch);

        return this;
    },

    beginDraw: function ()
    {
        this.texture.beginDraw();

        return this;
    },

    batchDraw: function (entries, x, y, alpha, tint)
    {
        this.texture.batchDraw(entries, x, y, alpha, tint);

        return this;
    },

    batchDrawFrame: function (key, frame, x, y, alpha, tint)
    {
        this.texture.batchDrawFrame(key, frame, x, y, alpha, tint);

        return this;
    },

    endDraw: function (erase)
    {
        this.texture.endDraw(erase);

        return this;
    },

    snapshotArea: function (x, y, width, height, callback, type, encoderOptions)
    {
        this.texture.snapshotArea(x, y, width, height, callback, type, encoderOptions);

        return this;
    },

    snapshot: function (callback, type, encoderOptions)
    {
        return this.snapshotArea(0, 0, this.width, this.height, callback, type, encoderOptions);
    },

    snapshotPixel: function (x, y, callback)
    {
        return this.snapshotArea(x, y, 1, 1, callback, 'pixel');
    },

    preDestroy: function ()
    {
        this.camera = null;

        if (!this._saved)
        {
            this.texture.destroy();
        }
    }

});

module.exports = RenderTexture;
