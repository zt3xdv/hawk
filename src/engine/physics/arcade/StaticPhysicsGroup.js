var ArcadeSprite = require('./ArcadeSprite');
var Class = require('../../utils/Class');
var CollisionComponent = require('./components/Collision');
var CONST = require('./const');
var GetFastValue = require('../../utils/object/GetFastValue');
var Group = require('../../gameobjects/group/Group');
var IsPlainObject = require('../../utils/object/IsPlainObject');

var StaticPhysicsGroup = new Class({

    Extends: Group,

    Mixins: [
        CollisionComponent
    ],

    initialize:

    function StaticPhysicsGroup (world, scene, children, config)
    {
        if (!children && !config)
        {
            config = {
                internalCreateCallback: this.createCallbackHandler,
                internalRemoveCallback: this.removeCallbackHandler,
                createMultipleCallback: this.createMultipleCallbackHandler,
                classType: ArcadeSprite
            };
        }
        else if (IsPlainObject(children))
        {

            config = children;
            children = null;

            config.internalCreateCallback = this.createCallbackHandler;
            config.internalRemoveCallback = this.removeCallbackHandler;
            config.createMultipleCallback = this.createMultipleCallbackHandler;
            config.classType = GetFastValue(config, 'classType', ArcadeSprite);
        }
        else if (Array.isArray(children) && IsPlainObject(children[0]))
        {

            config = children;
            children = null;

            config.forEach(function (singleConfig)
            {
                singleConfig.internalCreateCallback = this.createCallbackHandler;
                singleConfig.internalRemoveCallback = this.removeCallbackHandler;
                singleConfig.createMultipleCallback = this.createMultipleCallbackHandler;
                singleConfig.classType = GetFastValue(singleConfig, 'classType', ArcadeSprite);
            });
        }
        else
        {

            config = {
                internalCreateCallback: this.createCallbackHandler,
                internalRemoveCallback: this.removeCallbackHandler
            };
        }

        this.world = world;

        this.physicsType = CONST.STATIC_BODY;

        this.collisionCategory = 0x0001;

        this.collisionMask = 1;

        Group.call(this, scene, children, config);

        this.type = 'StaticPhysicsGroup';
    },

    createCallbackHandler: function (child)
    {
        if (!child.body)
        {
            this.world.enableBody(child, CONST.STATIC_BODY);
        }
    },

    removeCallbackHandler: function (child)
    {
        if (child.body)
        {
            this.world.disableBody(child);
        }
    },

    createMultipleCallbackHandler: function ()
    {
        this.refresh();
    },

    refresh: function ()
    {
        var children = this.children.entries;

        for (var i = 0; i < children.length; i++)
        {
            children[i].body.reset();
        }

        return this;
    }

});

module.exports = StaticPhysicsGroup;
