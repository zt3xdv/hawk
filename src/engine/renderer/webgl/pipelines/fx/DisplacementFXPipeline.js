var Class = require('../../../../utils/Class');
var DisplacementFrag = require('../../shaders/FXDisplacement-frag');
var PostFXPipeline = require('../PostFXPipeline');

var DisplacementFXPipeline = new Class({

    Extends: PostFXPipeline,

    initialize:

    function DisplacementFXPipeline (game)
    {
        PostFXPipeline.call(this, {
            game: game,
            fragShader: DisplacementFrag
        });

        this.x = 0.005;

        this.y = 0.005;

        this.glTexture;
    },

    onBoot: function ()
    {
        this.setTexture('__WHITE');
    },

    setTexture: function (texture)
    {
        var hawkTexture = this.game.textures.getFrame(texture);

        if (hawkTexture)
        {
            this.glTexture = hawkTexture.glTexture;
        }
    },

    onDraw: function (source)
    {
        var controller = this.getController();

        var target = this.fullFrame1;

        this.bind();

        this.set1i('uMainSampler', 0);
        this.set1i('uDisplacementSampler', 1);
        this.set2f('amount', controller.x, controller.y);

        this.bindTexture(controller.glTexture, 1);

        this.copySprite(source, target);

        this.copyToGame(target);
    }

});

module.exports = DisplacementFXPipeline;
