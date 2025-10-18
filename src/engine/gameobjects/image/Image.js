var Class = require('../../utils/Class');
var Components = require('../components');
var GameObject = require('../GameObject');
var ImageRender = require('./ImageRender');

var Image = new Class({

    Extends: GameObject,

    Mixins: [
        Components.Alpha,
        Components.BlendMode,
        Components.Depth,
        Components.Flip,
        Components.GetBounds,
        Components.Mask,
        Components.Origin,
        Components.Pipeline,
        Components.PostPipeline,
        Components.ScrollFactor,
        Components.Size,
        Components.TextureCrop,
        Components.Tint,
        Components.Transform,
        Components.Visible,
        ImageRender
    ],

    initialize:

    function Image (scene, x, y, texture, frame)
    {
        GameObject.call(this, scene, 'Image');

        this._crop = this.resetCropObject();

        this.setTexture(texture, frame);
        this.setPosition(x, y);
        this.setSizeToFrame();
        this.setOriginFromFrame();
        this.initPipeline();
        this.initPostPipeline(true);
    }

});

module.exports = Image;
