var Class = require('../../utils/Class');
var Effects = require('../../fx/');
var SpliceOne = require('../../utils/array/SpliceOne');

var FX = new Class({

    initialize:

    function FX (gameObject, isPost)
    {

        this.gameObject = gameObject;

        this.isPost = isPost;

        this.enabled = false;

        this.list = [];

        this.padding = 0;
    },

    setPadding: function (padding)
    {
        if (padding === undefined) { padding = 0; }

        this.padding = padding;

        return this.gameObject;
    },

    onFXCopy: function ()
    {
    },

    onFX: function ()
    {
    },

    enable: function (padding)
    {
        if (this.isPost)
        {
            return;
        }

        var renderer = this.gameObject.scene.sys.renderer;

        if (renderer && renderer.pipelines)
        {
            this.gameObject.pipeline = renderer.pipelines.FX_PIPELINE;

            if (padding !== undefined)
            {
                this.padding = padding;
            }

            this.enabled = true;
        }
        else
        {
            this.enabled = false;
        }
    },

    clear: function ()
    {
        if (this.isPost)
        {
            this.gameObject.resetPostPipeline(true);
        }
        else
        {
            var list = this.list;

            for (var i = 0; i < list.length; i++)
            {
                list[i].destroy();
            }

            this.list = [];
        }

        this.enabled = false;

        return this.gameObject;
    },

    remove: function (fx)
    {
        var i;

        if (this.isPost)
        {
            var pipelines = this.gameObject.getPostPipeline(String(fx.type));

            if (!Array.isArray(pipelines))
            {
                pipelines = [ pipelines ];
            }

            for (i = 0; i < pipelines.length; i++)
            {
                var pipeline = pipelines[i];

                if (pipeline.controller === fx)
                {
                    this.gameObject.removePostPipeline(pipeline);

                    fx.destroy();

                    break;
                }
            }
        }
        else
        {
            var list = this.list;

            for (i = 0; i < list.length; i++)
            {
                if (list[i] === fx)
                {
                    SpliceOne(list, i);

                    fx.destroy();
                }
            }
        }

        return this.gameObject;
    },

    disable: function (clear)
    {
        if (clear === undefined) { clear = false; }

        if (!this.isPost)
        {
            this.gameObject.resetPipeline();
        }

        this.enabled = false;

        if (clear)
        {
            this.clear();
        }

        return this.gameObject;
    },

    add: function (fx, config)
    {
        if (this.isPost)
        {
            var type = String(fx.type);

            this.gameObject.setPostPipeline(type, config);

            var pipeline = this.gameObject.getPostPipeline(type);

            if (pipeline)
            {
                if (Array.isArray(pipeline))
                {
                    pipeline = pipeline.pop();
                }

                if (pipeline)
                {
                    pipeline.controller = fx;
                }

                return fx;
            }
        }
        else
        {
            if (!this.enabled)
            {
                this.enable();
            }

            this.list.push(fx);

            return fx;
        }
    },

    addGlow: function (color, outerStrength, innerStrength, knockout, quality, distance)
    {
        return this.add(new Effects.Glow(this.gameObject, color, outerStrength, innerStrength, knockout), { quality: quality, distance: distance });
    },

    addShadow: function (x, y, decay, power, color, samples, intensity)
    {
        return this.add(new Effects.Shadow(this.gameObject, x, y, decay, power, color, samples, intensity));
    },

    addPixelate: function (amount)
    {
        return this.add(new Effects.Pixelate(this.gameObject, amount));
    },

    addVignette: function (x, y, radius, strength)
    {
        return this.add(new Effects.Vignette(this.gameObject, x, y, radius, strength));
    },

    addShine: function (speed, lineWidth, gradient, reveal)
    {
        return this.add(new Effects.Shine(this.gameObject, speed, lineWidth, gradient, reveal));
    },

    addBlur: function (quality, x, y, strength, color, steps)
    {
        return this.add(new Effects.Blur(this.gameObject, quality, x, y, strength, color, steps));
    },

    addGradient: function (color1, color2, alpha, fromX, fromY, toX, toY, size)
    {
        return this.add(new Effects.Gradient(this.gameObject, color1, color2, alpha, fromX, fromY, toX, toY, size));
    },

    addBloom: function (color, offsetX, offsetY, blurStrength, strength, steps)
    {
        return this.add(new Effects.Bloom(this.gameObject, color, offsetX, offsetY, blurStrength, strength, steps));
    },

    addColorMatrix: function ()
    {
        return this.add(new Effects.ColorMatrix(this.gameObject));
    },

    addCircle: function (thickness, color, backgroundColor, scale, feather)
    {
        return this.add(new Effects.Circle(this.gameObject, thickness, color, backgroundColor, scale, feather));
    },

    addBarrel: function (amount)
    {
        return this.add(new Effects.Barrel(this.gameObject, amount));
    },

    addDisplacement: function (texture, x, y)
    {
        return this.add(new Effects.Displacement(this.gameObject, texture, x, y));
    },

    addWipe: function (wipeWidth, direction, axis)
    {
        return this.add(new Effects.Wipe(this.gameObject, wipeWidth, direction, axis));
    },

    addReveal: function (wipeWidth, direction, axis)
    {
        return this.add(new Effects.Wipe(this.gameObject, wipeWidth, direction, axis, true));
    },

    addBokeh: function (radius, amount, contrast)
    {
        return this.add(new Effects.Bokeh(this.gameObject, radius, amount, contrast));
    },

    addTiltShift: function (radius, amount, contrast, blurX, blurY, strength)
    {
        return this.add(new Effects.Bokeh(this.gameObject, radius, amount, contrast, true, blurX, blurY, strength));
    },

    destroy: function ()
    {
        this.clear();

        this.gameObject = null;
    }

});

module.exports = FX;
