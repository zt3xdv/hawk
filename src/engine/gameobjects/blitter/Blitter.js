var BlitterRender = require('./BlitterRender');
var Bob = require('./Bob');
var Class = require('../../utils/Class');
var Components = require('../components');
var Frame = require('../../textures/Frame');
var GameObject = require('../GameObject');
var List = require('../../structs/List');

var Blitter = new Class({

    Extends: GameObject,

    Mixins: [
        Components.Alpha,
        Components.BlendMode,
        Components.Depth,
        Components.Mask,
        Components.Pipeline,
        Components.PostPipeline,
        Components.ScrollFactor,
        Components.Size,
        Components.Texture,
        Components.Transform,
        Components.Visible,
        BlitterRender
    ],

    initialize:

    function Blitter (scene, x, y, texture, frame)
    {
        GameObject.call(this, scene, 'Blitter');

        this.setTexture(texture, frame);
        this.setPosition(x, y);
        this.initPipeline();
        this.initPostPipeline();

        this.children = new List();

        this.renderList = [];

        this.dirty = false;
    },

    create: function (x, y, frame, visible, index)
    {
        if (visible === undefined) { visible = true; }
        if (index === undefined) { index = this.children.length; }

        if (frame === undefined)
        {
            frame = this.frame;
        }
        else if (!(frame instanceof Frame))
        {
            frame = this.texture.get(frame);
        }

        var bob = new Bob(this, x, y, frame, visible);

        this.children.addAt(bob, index, false);

        this.dirty = true;

        return bob;
    },

    createFromCallback: function (callback, quantity, frame, visible)
    {
        var bobs = this.createMultiple(quantity, frame, visible);

        for (var i = 0; i < bobs.length; i++)
        {
            var bob = bobs[i];

            callback.call(this, bob, i);
        }

        return bobs;
    },

    createMultiple: function (quantity, frame, visible)
    {
        if (frame === undefined) { frame = this.frame.name; }
        if (visible === undefined) { visible = true; }

        if (!Array.isArray(frame))
        {
            frame = [ frame ];
        }

        var bobs = [];
        var _this = this;

        frame.forEach(function (singleFrame)
        {
            for (var i = 0; i < quantity; i++)
            {
                bobs.push(_this.create(0, 0, singleFrame, visible));
            }
        });

        return bobs;
    },

    childCanRender: function (child)
    {
        return (child.visible && child.alpha > 0);
    },

    getRenderList: function ()
    {
        if (this.dirty)
        {
            this.renderList = this.children.list.filter(this.childCanRender, this);
            this.dirty = false;
        }

        return this.renderList;
    },

    clear: function ()
    {
        this.children.removeAll();
        this.dirty = true;
    },

    preDestroy: function ()
    {
        this.children.destroy();

        this.renderList = [];
    }

});

module.exports = Blitter;
