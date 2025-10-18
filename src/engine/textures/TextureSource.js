var CanvasPool = require('../display/canvas/CanvasPool');
var Class = require('../utils/Class');
var IsSizePowerOfTwo = require('../math/pow2/IsSizePowerOfTwo');
var ScaleModes = require('../renderer/ScaleModes');
var WebGLTextureWrapper = require('../renderer/webgl/wrappers/WebGLTextureWrapper');

var TextureSource = new Class({

    initialize:

    function TextureSource (texture, source, width, height, flipY)
    {
        if (flipY === undefined) { flipY = false; }

        var game = texture.manager.game;

        this.renderer = game.renderer;

        this.texture = texture;

        this.source = source;

        this.image = (source.compressed) ? null : source;

        this.compressionAlgorithm = (source.compressed) ? source.format : null;

        this.resolution = 1;

        this.width = width || source.naturalWidth || source.videoWidth || source.width || 0;

        this.height = height || source.naturalHeight || source.videoHeight || source.height || 0;

        this.scaleMode = ScaleModes.DEFAULT;

        this.isCanvas = (source instanceof HTMLCanvasElement);

        this.isVideo = (window.hasOwnProperty('HTMLVideoElement') && source instanceof HTMLVideoElement);

        this.isRenderTexture = (source.type === 'RenderTexture' || source.type === 'DynamicTexture');

        this.isGLTexture = source instanceof WebGLTextureWrapper;

        this.isPowerOf2 = IsSizePowerOfTwo(this.width, this.height);

        this.glTexture = null;

        this.flipY = flipY;

        this.init(game);
    },

    init: function (game)
    {
        var renderer = this.renderer;

        if (renderer)
        {
            var source = this.source;

            if (renderer.gl)
            {
                var image = this.image;
                var flipY = this.flipY;
                var width = this.width;
                var height = this.height;
                var scaleMode = this.scaleMode;

                if (this.isCanvas)
                {
                    this.glTexture = renderer.createCanvasTexture(image, false, flipY);
                }
                else if (this.isVideo)
                {
                    this.glTexture = renderer.createVideoTexture(image, false, flipY);
                }
                else if (this.isRenderTexture)
                {
                    this.glTexture = renderer.createTextureFromSource(null, width, height, scaleMode);
                }
                else if (this.isGLTexture)
                {
                    this.glTexture = source;
                }
                else if (this.compressionAlgorithm)
                {
                    this.glTexture = renderer.createTextureFromSource(source, undefined, undefined, scaleMode);
                }
                else if (source instanceof Uint8Array)
                {
                    this.glTexture = renderer.createUint8ArrayTexture(source, width, height, scaleMode);
                }
                else
                {
                    this.glTexture = renderer.createTextureFromSource(image, width, height, scaleMode);
                }

                if (typeof WEBGL_DEBUG)
                {
                    this.glTexture.spectorMetadata = { textureKey: this.texture.key };
                }
            }
            else if (this.isRenderTexture)
            {
                this.image = source.canvas;
            }
        }

        if (!game.config.antialias)
        {
            this.setFilter(1);
        }
    },

    setFilter: function (filterMode)
    {
        if (this.renderer && this.renderer.gl)
        {
            this.renderer.setTextureFilter(this.glTexture, filterMode);
        }

        this.scaleMode = filterMode;
    },

    setFlipY: function (value)
    {
        if (value === undefined) { value = true; }

        if (value === this.flipY) { return this; }

        this.flipY = value;
        this.update();

        return this;
    },

    update: function ()
    {
        var renderer = this.renderer;
        var image = this.image;
        var flipY = this.flipY;
        var gl = renderer.gl;

        if (gl && this.isCanvas)
        {
            renderer.updateCanvasTexture(image, this.glTexture, flipY);
        }
        else if (gl && this.isVideo)
        {
            renderer.updateVideoTexture(image, this.glTexture, flipY);
        }
    },

    destroy: function ()
    {
        if (this.glTexture)
        {
            this.renderer.deleteTexture(this.glTexture);
        }

        if (this.isCanvas)
        {
            CanvasPool.remove(this.image);
        }

        this.renderer = null;
        this.texture = null;
        this.source = null;
        this.image = null;
        this.glTexture = null;
    }

});

module.exports = TextureSource;
