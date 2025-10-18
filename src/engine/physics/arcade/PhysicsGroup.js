var ArcadeSprite = require('./ArcadeSprite');
var Class = require('../../utils/Class');
var CollisionComponent = require('./components/Collision');
var CONST = require('./const');
var GetFastValue = require('../../utils/object/GetFastValue');
var Group = require('../../gameobjects/group/Group');
var IsPlainObject = require('../../utils/object/IsPlainObject');

var PhysicsGroup = new Class({

    Extends: Group,

    Mixins: [
        CollisionComponent
    ],

    initialize:

    function PhysicsGroup (world, scene, children, config)
    {
        if (!children && !config)
        {
            config = {
                internalCreateCallback: this.createCallbackHandler,
                internalRemoveCallback: this.removeCallbackHandler
            };
        }
        else if (IsPlainObject(children))
        {

            config = children;
            children = null;

            config.internalCreateCallback = this.createCallbackHandler;
            config.internalRemoveCallback = this.removeCallbackHandler;
        }
        else if (Array.isArray(children) && IsPlainObject(children[0]))
        {

            var _this = this;

            children.forEach(function (singleConfig)
            {
                singleConfig.internalCreateCallback = _this.createCallbackHandler;
                singleConfig.internalRemoveCallback = _this.removeCallbackHandler;
                singleConfig.classType = GetFastValue(singleConfig, 'classType', ArcadeSprite);
            });

            config = null;
        }
        else
        {

            config = {
                internalCreateCallback: this.createCallbackHandler,
                internalRemoveCallback: this.removeCallbackHandler
            };
        }

        this.world = world;

        if (config)
        {
            config.classType = GetFastValue(config, 'classType', ArcadeSprite);
        }

        this.physicsType = CONST.DYNAMIC_BODY;

        this.collisionCategory = 0x0001;

        this.collisionMask = 2147483647;

        this.defaults = {
            setCollideWorldBounds: GetFastValue(config, 'collideWorldBounds', false),
            setBoundsRectangle: GetFastValue(config, 'customBoundsRectangle', null),
            setAccelerationX: GetFastValue(config, 'accelerationX', 0),
            setAccelerationY: GetFastValue(config, 'accelerationY', 0),
            setAllowDrag: GetFastValue(config, 'allowDrag', true),
            setAllowGravity: GetFastValue(config, 'allowGravity', true),
            setAllowRotation: GetFastValue(config, 'allowRotation', true),
            setDamping: GetFastValue(config, 'useDamping', false),
            setBounceX: GetFastValue(config, 'bounceX', 0),
            setBounceY: GetFastValue(config, 'bounceY', 0),
            setDragX: GetFastValue(config, 'dragX', 0),
            setDragY: GetFastValue(config, 'dragY', 0),
            setEnable: GetFastValue(config, 'enable', true),
            setGravityX: GetFastValue(config, 'gravityX', 0),
            setGravityY: GetFastValue(config, 'gravityY', 0),
            setFrictionX: GetFastValue(config, 'frictionX', 0),
            setFrictionY: GetFastValue(config, 'frictionY', 0),
            setMaxSpeed: GetFastValue(config, 'maxSpeed', -1),
            setMaxVelocityX: GetFastValue(config, 'maxVelocityX', 10000),
            setMaxVelocityY: GetFastValue(config, 'maxVelocityY', 10000),
            setVelocityX: GetFastValue(config, 'velocityX', 0),
            setVelocityY: GetFastValue(config, 'velocityY', 0),
            setAngularVelocity: GetFastValue(config, 'angularVelocity', 0),
            setAngularAcceleration: GetFastValue(config, 'angularAcceleration', 0),
            setAngularDrag: GetFastValue(config, 'angularDrag', 0),
            setMass: GetFastValue(config, 'mass', 1),
            setImmovable: GetFastValue(config, 'immovable', false)
        };

        Group.call(this, scene, children, config);

        this.type = 'PhysicsGroup';
    },

    createCallbackHandler: function (child)
    {
        if (!child.body)
        {
            this.world.enableBody(child, CONST.DYNAMIC_BODY);
        }

        var body = child.body;

        for (var key in this.defaults)
        {
            body[key](this.defaults[key]);
        }
    },

    removeCallbackHandler: function (child)
    {
        if (child.body)
        {
            this.world.disableBody(child);
        }
    },

    setVelocity: function (x, y, step)
    {
        if (step === undefined) { step = 0; }

        var items = this.getChildren();

        for (var i = 0; i < items.length; i++)
        {
            items[i].body.velocity.set(x + (i * step), y + (i * step));
        }

        return this;
    },

    setVelocityX: function (value, step)
    {
        if (step === undefined) { step = 0; }

        var items = this.getChildren();

        for (var i = 0; i < items.length; i++)
        {
            items[i].body.velocity.x = value + (i * step);
        }

        return this;
    },

    setVelocityY: function (value, step)
    {
        if (step === undefined) { step = 0; }

        var items = this.getChildren();

        for (var i = 0; i < items.length; i++)
        {
            items[i].body.velocity.y = value + (i * step);
        }

        return this;
    }

});

module.exports = PhysicsGroup;
