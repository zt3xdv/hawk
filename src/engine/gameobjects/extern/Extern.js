var Class = require('../../utils/Class');
var Components = require('../components');
var GameObject = require('../GameObject');
var ExternRender = require('./ExternRender');

var Extern = new Class({

    Extends: GameObject,

    Mixins: [
        Components.Alpha,
        Components.BlendMode,
        Components.Depth,
        Components.Flip,
        Components.Origin,
        Components.ScrollFactor,
        Components.Size,
        Components.Texture,
        Components.Tint,
        Components.Transform,
        Components.Visible,
        ExternRender
    ],

    initialize:

    function Extern (scene)
    {
        GameObject.call(this, scene, 'Extern');
    },

    addedToScene: function ()
    {
        this.scene.sys.updateList.add(this);
    },

    removedFromScene: function ()
    {
        this.scene.sys.updateList.remove(this);
    },

    preUpdate: function ()
    {

    },

    render: function ()
    {

    }

});

module.exports = Extern;
