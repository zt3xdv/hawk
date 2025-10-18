var CanvasPool = require('../display/canvas/CanvasPool');
var CanvasTexture = require('./CanvasTexture');
var Class = require('../utils/Class');
var Color = require('../display/color/Color');
var CONST = require('../const');
var DynamicTexture = require('./DynamicTexture');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var Frame = require('./Frame');
var GameEvents = require('../core/events');
var GenerateTexture = require('../create/GenerateTexture');
var GetValue = require('../utils/object/GetValue');
var ImageGameObject = require('../gameobjects/image/Image');
var IsPlainObject = require('../utils/object/IsPlainObject');
var Parser = require('./parsers');
var Rectangle = require('../geom/rectangle/Rectangle');
var Texture = require('./Texture');

var TextureManager = new Class({

    Extends: EventEmitter,

    initialize:

    function TextureManager (game)
    {
        EventEmitter.call(this);

        this.game = game;

        this.name = 'TextureManager';

        this.list = {};

        this._tempCanvas = CanvasPool.create2D(this);

        this._tempContext = this._tempCanvas.getContext('2d', { willReadFrequently: true });

        this._pending = 0;

        this.stamp;

        this.stampCrop = new Rectangle();

        this.silentWarnings = false;

        game.events.once(GameEvents.BOOT, this.boot, this);
    },

    boot: function ()
    {
        this._pending = 3;

        this.on(Events.LOAD, this.updatePending, this);
        this.on(Events.ERROR, this.updatePending, this);

        var config = this.game.config;

        if (config.defaultImage !== null)
        {
            this.addBase64('__DEFAULT', config.defaultImage);
        }

        if (config.missingImage !== null)
        {
            this.addBase64('__MISSING', config.missingImage);
        }

        if (config.whiteImage !== null)
        {
            this.addBase64('__WHITE', config.whiteImage);
        }

        if (this.game.renderer && this.game.renderer.gl)
        {
            this.addUint8Array('__NORMAL', new Uint8Array([ 127, 127, 255, 255 ]), 1, 1);
        }

        this.game.events.once(GameEvents.DESTROY, this.destroy, this);

        this.game.events.once(GameEvents.SYSTEM_READY, function (scene)
        {
            this.stamp = new ImageGameObject(scene).setOrigin(0);

        }, this);
    },

    updatePending: function ()
    {
        this._pending--;

        if (this._pending === 0)
        {
            this.off(Events.LOAD);
            this.off(Events.ERROR);

            this.emit(Events.READY);
        }
    },

    checkKey: function (key)
    {
        if (!key || typeof key !== 'string' || this.exists(key))
        {
            if (!this.silentWarnings)
            {

                console.error('Texture key already in use: ' + key);
            }

            return false;
        }

        return true;
    },

    remove: function (key)
    {
        if (typeof key === 'string')
        {
            if (this.exists(key))
            {
                key = this.get(key);
            }
            else
            {
                if (!this.silentWarnings)
                {
                    console.warn('No texture found matching key: ' + key);
                }

                return this;
            }
        }

        var textureKey = key.key;

        if (this.list.hasOwnProperty(textureKey))
        {
            key.destroy();

            this.emit(Events.REMOVE, textureKey);
            this.emit(Events.REMOVE_KEY + textureKey);
        }

        return this;
    },

    removeKey: function (key)
    {
        if (this.list.hasOwnProperty(key))
        {
            delete this.list[key];
        }

        return this;
    },

    addBase64: function (key, data)
    {
        if (this.checkKey(key))
        {
            var _this = this;

            var image = new Image();

            image.onerror = function ()
            {
                _this.emit(Events.ERROR, key);
            };

            image.onload = function ()
            {
                var texture = _this.create(key, image);

                if (!texture)
                {
                    return;
                }

                Parser.Image(texture, 0);

                _this.emit(Events.ADD, key, texture);
                _this.emit(Events.ADD_KEY + key, texture);
                _this.emit(Events.LOAD, key, texture);
            };

            image.src = data;
        }

        return this;
    },

    getBase64: function (key, frame, type, encoderOptions)
    {
        if (type === undefined) { type = 'image/png'; }
        if (encoderOptions === undefined) { encoderOptions = 0.92; }

        var data = '';

        var textureFrame = this.getFrame(key, frame);

        if (textureFrame && (textureFrame.source.isRenderTexture || textureFrame.source.isGLTexture))
        {
            if (!this.silentWarnings)
            {
                console.warn('Cannot getBase64 from WebGL Texture');
            }
        }
        else if (textureFrame)
        {
            var cd = textureFrame.canvasData;

            var canvas = CanvasPool.create2D(this, cd.width, cd.height);
            var ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (cd.width > 0 && cd.height > 0)
            {
                ctx.drawImage(
                    textureFrame.source.image,
                    cd.x,
                    cd.y,
                    cd.width,
                    cd.height,
                    0,
                    0,
                    cd.width,
                    cd.height
                );
            }

            data = canvas.toDataURL(type, encoderOptions);

            CanvasPool.remove(canvas);
        }

        return data;
    },

    addImage: function (key, source, dataSource)
    {
        var texture = null;

        if (this.checkKey(key))
        {
            texture = this.create(key, source);

            Parser.Image(texture, 0);

            if (dataSource)
            {
                texture.setDataSource(dataSource);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addGLTexture: function (key, glTexture)
    {
        var texture = null;

        if (this.checkKey(key))
        {
            var width = glTexture.width;
            var height = glTexture.height;

            texture = this.create(key, glTexture, width, height);

            texture.add('__BASE', 0, 0, 0, width, height);

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addCompressedTexture: function (key, textureData, atlasData)
    {
        var texture = null;

        if (this.checkKey(key))
        {
            texture = this.create(key, textureData);

            texture.add('__BASE', 0, 0, 0, textureData.width, textureData.height);

            if (atlasData)
            {
                var parse = function (texture, sourceIndex, atlasData)
                {
                    if (Array.isArray(atlasData.textures) || Array.isArray(atlasData.frames))
                    {
                        Parser.JSONArray(texture, sourceIndex, atlasData);
                    }
                    else
                    {
                        Parser.JSONHash(texture, sourceIndex, atlasData);
                    }
                };
                if (Array.isArray(atlasData))
                {
                    for (var i = 0; i < atlasData.length; i++)
                    {
                        parse(texture, i, atlasData[i]);
                    }
                }
                else
                {
                    parse(texture, 0, atlasData);
                }
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addRenderTexture: function (key, renderTexture)
    {
        var texture = null;

        if (this.checkKey(key))
        {
            texture = this.create(key, renderTexture);

            texture.add('__BASE', 0, 0, 0, renderTexture.width, renderTexture.height);

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    generate: function (key, config)
    {
        if (this.checkKey(key))
        {
            var canvas = CanvasPool.create(this, 1, 1);

            config.canvas = canvas;

            GenerateTexture(config);

            return this.addCanvas(key, canvas);
        }
        else
        {
            return null;
        }
    },

    createCanvas: function (key, width, height)
    {
        if (width === undefined) { width = 256; }
        if (height === undefined) { height = 256; }

        if (this.checkKey(key))
        {
            var canvas = CanvasPool.create(this, width, height, CONST.CANVAS, true);

            return this.addCanvas(key, canvas);
        }

        return null;
    },

    addCanvas: function (key, source, skipCache)
    {
        if (skipCache === undefined) { skipCache = false; }

        var texture = null;

        if (skipCache)
        {
            texture = new CanvasTexture(this, key, source, source.width, source.height);
        }
        else if (this.checkKey(key))
        {
            texture = new CanvasTexture(this, key, source, source.width, source.height);

            this.list[key] = texture;

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addDynamicTexture: function (key, width, height)
    {
        var texture = null;

        if (typeof(key) === 'string' && !this.exists(key))
        {
            texture = new DynamicTexture(this, key, width, height);
        }
        else
        {
            texture = key;
            key = texture.key;
        }

        if (this.checkKey(key))
        {
            this.list[key] = texture;

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }
        else
        {
            texture = null;
        }

        return texture;
    },

    addAtlas: function (key, source, data, dataSource)
    {

        if (Array.isArray(data.textures) || Array.isArray(data.frames))
        {
            return this.addAtlasJSONArray(key, source, data, dataSource);
        }
        else
        {
            return this.addAtlasJSONHash(key, source, data, dataSource);
        }
    },

    addAtlasJSONArray: function (key, source, data, dataSource)
    {
        var texture = null;

        if (source instanceof Texture)
        {
            key = source.key;
            texture = source;
        }
        else if (this.checkKey(key))
        {
            texture = this.create(key, source);
        }

        if (texture)
        {

            if (Array.isArray(data))
            {
                var singleAtlasFile = (data.length === 1); 

                for (var i = 0; i < texture.source.length; i++)
                {
                    var atlasData = singleAtlasFile ? data[0] : data[i];

                    Parser.JSONArray(texture, i, atlasData);
                }
            }
            else
            {
                Parser.JSONArray(texture, 0, data);
            }

            if (dataSource)
            {
                texture.setDataSource(dataSource);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addAtlasJSONHash: function (key, source, data, dataSource)
    {
        var texture = null;

        if (source instanceof Texture)
        {
            key = source.key;
            texture = source;
        }
        else if (this.checkKey(key))
        {
            texture = this.create(key, source);
        }

        if (texture)
        {
            if (Array.isArray(data))
            {
                for (var i = 0; i < data.length; i++)
                {
                    Parser.JSONHash(texture, i, data[i]);
                }
            }
            else
            {
                Parser.JSONHash(texture, 0, data);
            }

            if (dataSource)
            {
                texture.setDataSource(dataSource);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addAtlasXML: function (key, source, data, dataSource)
    {
        var texture = null;

        if (source instanceof Texture)
        {
            key = source.key;
            texture = source;
        }
        else if (this.checkKey(key))
        {
            texture = this.create(key, source);
        }

        if (texture)
        {
            Parser.AtlasXML(texture, 0, data);

            if (dataSource)
            {
                texture.setDataSource(dataSource);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addUnityAtlas: function (key, source, data, dataSource)
    {
        var texture = null;

        if (source instanceof Texture)
        {
            key = source.key;
            texture = source;
        }
        else if (this.checkKey(key))
        {
            texture = this.create(key, source);
        }

        if (texture)
        {
            Parser.UnityYAML(texture, 0, data);

            if (dataSource)
            {
                texture.setDataSource(dataSource);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addSpriteSheet: function (key, source, config, dataSource)
    {
        var texture = null;

        if (source instanceof Texture)
        {
            key = source.key;
            texture = source;
        }
        else if (this.checkKey(key))
        {
            texture = this.create(key, source);
        }

        if (texture)
        {
            var width = texture.source[0].width;
            var height = texture.source[0].height;

            Parser.SpriteSheet(texture, 0, 0, 0, width, height, config);

            if (dataSource)
            {
                texture.setDataSource(dataSource);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);
        }

        return texture;
    },

    addSpriteSheetFromAtlas: function (key, config)
    {
        if (!this.checkKey(key))
        {
            return null;
        }

        var atlasKey = GetValue(config, 'atlas', null);
        var atlasFrame = GetValue(config, 'frame', null);

        if (!atlasKey || !atlasFrame)
        {
            return;
        }

        var atlas = this.get(atlasKey);
        var sheet = atlas.get(atlasFrame);

        if (sheet)
        {
            var source = sheet.source.image;
            if (!source)
            {
                source = sheet.source.glTexture;
            }
            var texture = this.create(key, source);

            if (sheet.trimmed)
            {

                Parser.SpriteSheetFromAtlas(texture, sheet, config);
            }
            else
            {
                Parser.SpriteSheet(texture, 0, sheet.cutX, sheet.cutY, sheet.cutWidth, sheet.cutHeight, config);
            }

            this.emit(Events.ADD, key, texture);
            this.emit(Events.ADD_KEY + key, texture);

            return texture;
        }
    },

    addUint8Array: function (key, data, width, height)
    {
        if (
            !this.checkKey(key) ||
            data.length / 4 !== width * height
        )
        {
            return null;
        }

        var texture = this.create(key, data, width, height);

        texture.add('__BASE', 0, 0, 0, width, height);

        this.emit(Events.ADD, key, texture);
        this.emit(Events.ADD_KEY + key, texture);

        return texture;
    },

    create: function (key, source, width, height)
    {
        var texture = null;

        if (this.checkKey(key))
        {
            texture = new Texture(this, key, source, width, height);

            this.list[key] = texture;
        }

        return texture;
    },

    exists: function (key)
    {
        return (this.list.hasOwnProperty(key));
    },

    get: function (key)
    {
        if (key === undefined) { key = '__DEFAULT'; }

        if (this.list[key])
        {
            return this.list[key];
        }
        else if (key instanceof Texture)
        {
            return key;
        }
        else if (key instanceof Frame)
        {
            return key.texture;
        }
        else
        {
            return this.list['__MISSING'];
        }
    },

    cloneFrame: function (key, frame)
    {
        if (this.list[key])
        {
            return this.list[key].get(frame).clone();
        }
    },

    getFrame: function (key, frame)
    {
        if (this.list[key])
        {
            return this.list[key].get(frame);
        }
    },

    parseFrame: function (key)
    {
        if (!key)
        {
            return undefined;
        }
        else if (typeof key === 'string')
        {
            return this.getFrame(key);
        }
        else if (Array.isArray(key) && key.length === 2)
        {
            return this.getFrame(key[0], key[1]);
        }
        else if (IsPlainObject(key))
        {
            return this.getFrame(key.key, key.frame);
        }
        else if (key instanceof Texture)
        {
            return key.get();
        }
        else if (key instanceof Frame)
        {
            return key;
        }
    },

    getTextureKeys: function ()
    {
        var output = [];

        for (var key in this.list)
        {
            if (key !== '__DEFAULT' && key !== '__MISSING' && key !== '__WHITE' && key !== '__NORMAL')
            {
                output.push(key);
            }
        }

        return output;
    },

    getPixel: function (x, y, key, frame)
    {
        var textureFrame = this.getFrame(key, frame);

        if (textureFrame)
        {

            x -= textureFrame.x;
            y -= textureFrame.y;

            var data = textureFrame.data.cut;

            x += data.x;
            y += data.y;

            if (x >= data.x && x < data.r && y >= data.y && y < data.b)
            {
                var ctx = this._tempContext;

                ctx.clearRect(0, 0, 1, 1);
                ctx.drawImage(textureFrame.source.image, x, y, 1, 1, 0, 0, 1, 1);

                var rgb = ctx.getImageData(0, 0, 1, 1);

                return new Color(rgb.data[0], rgb.data[1], rgb.data[2], rgb.data[3]);
            }
        }

        return null;
    },

    getPixelAlpha: function (x, y, key, frame)
    {
        var textureFrame = this.getFrame(key, frame);

        if (textureFrame)
        {

            x -= textureFrame.x;
            y -= textureFrame.y;

            var data = textureFrame.data.cut;

            x += data.x;
            y += data.y;

            if (x >= data.x && x < data.r && y >= data.y && y < data.b)
            {
                var ctx = this._tempContext;

                ctx.clearRect(0, 0, 1, 1);
                ctx.drawImage(textureFrame.source.image, x, y, 1, 1, 0, 0, 1, 1);

                var rgb = ctx.getImageData(0, 0, 1, 1);

                return rgb.data[3];
            }
        }

        return null;
    },

    setTexture: function (gameObject, key, frame)
    {
        if (this.list[key])
        {
            gameObject.texture = this.list[key];
            gameObject.frame = gameObject.texture.get(frame);
        }

        return gameObject;
    },

    renameTexture: function (currentKey, newKey)
    {
        var texture = this.get(currentKey);

        if (texture && currentKey !== newKey)
        {
            texture.key = newKey;

            this.list[newKey] = texture;

            delete this.list[currentKey];

            return true;
        }

        return false;
    },

    each: function (callback, scope)
    {
        var args = [ null ];

        for (var i = 1; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }

        for (var texture in this.list)
        {
            args[0] = this.list[texture];

            callback.apply(scope, args);
        }
    },

    resetStamp: function (alpha, tint)
    {
        if (alpha === undefined) { alpha = 1; }
        if (tint === undefined) { tint = 0xffffff; }

        var stamp = this.stamp;

        stamp.setCrop();
        stamp.setPosition(0);
        stamp.setAngle(0);
        stamp.setScale(1);
        stamp.setAlpha(alpha);
        stamp.setTint(tint);
        stamp.setTexture('__WHITE');

        return stamp;
    },

    destroy: function ()
    {
        for (var texture in this.list)
        {
            this.list[texture].destroy();
        }

        this.list = {};

        this.stamp.destroy();

        this.game = null;
        this.stamp = null;

        CanvasPool.remove(this._tempCanvas);
    }

});

module.exports = TextureManager;
