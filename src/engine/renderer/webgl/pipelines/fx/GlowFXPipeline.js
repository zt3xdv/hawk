var Class = require('../../../../utils/Class');
var GetFastValue = require('../../../../utils/object/GetFastValue');
var GlowFrag = require('../../shaders/FXGlow-frag');
var PostFXPipeline = require('../PostFXPipeline');
var Utils = require('../../Utils');

var GlowFXPipeline = new Class({

    Extends: PostFXPipeline,

    initialize:

    function GlowFXPipeline (game, config)
    {
        var quality = GetFastValue(config, 'quality', 0.1);
        var distance = GetFastValue(config, 'distance', 10);

        PostFXPipeline.call(this, {
            game: game,
            fragShader: Utils.setGlowQuality(GlowFrag, game, quality, distance)
        });

        this.outerStrength = 4;

        this.innerStrength = 0;

        this.knockout = false;

        this.glcolor = [ 1, 1, 1, 1 ];
    },

    onPreRender: function (controller, shader, width, height)
    {
        controller = this.getController(controller);

        this.set1f('outerStrength', controller.outerStrength, shader);
        this.set1f('innerStrength', controller.innerStrength, shader);
        this.set4fv('glowColor', controller.glcolor, shader);
        this.setBoolean('knockout', controller.knockout, shader);

        if (width && height)
        {
            this.set2f('resolution', width, height, shader);
        }
    },

    onDraw: function (target)
    {
        this.set2f('resolution', target.width, target.height);

        this.bindAndDraw(target);
    }

});

module.exports = GlowFXPipeline;
