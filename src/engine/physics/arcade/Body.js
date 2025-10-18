var Class = require('../../utils/Class');
var CollisionComponent = require('./components/Collision');
var CONST = require('./const');
var Events = require('./events');
var RadToDeg = require('../../math/RadToDeg');
var Rectangle = require('../../geom/rectangle/Rectangle');
var RectangleContains = require('../../geom/rectangle/Contains');
var SetCollisionObject = require('./SetCollisionObject');
var Vector2 = require('../../math/Vector2');

var Body = new Class({

    Mixins: [
        CollisionComponent
    ],

    initialize:

    function Body (world, gameObject)
    {
        var width = 64;
        var height = 64;

        var dummyGameObject = {
            x: 0,
            y: 0,
            angle: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            displayOriginX: 0,
            displayOriginY: 0
        };

        var hasGameObject = (gameObject !== undefined);

        if (hasGameObject && gameObject.displayWidth)
        {
            width = gameObject.displayWidth;
            height = gameObject.displayHeight;
        }

        if (!hasGameObject)
        {
            gameObject = dummyGameObject;
        }

        this.world = world;

        this.gameObject = (hasGameObject) ? gameObject : undefined;

        this.isBody = true;

        this.transform = {
            x: gameObject.x,
            y: gameObject.y,
            rotation: gameObject.angle,
            scaleX: gameObject.scaleX,
            scaleY: gameObject.scaleY,
            displayOriginX: gameObject.displayOriginX,
            displayOriginY: gameObject.displayOriginY
        };

        this.debugShowBody = world.defaults.debugShowBody;

        this.debugShowVelocity = world.defaults.debugShowVelocity;

        this.debugBodyColor = world.defaults.bodyDebugColor;

        this.enable = true;

        this.isCircle = false;

        this.radius = 0;

        this.offset = new Vector2();

        this.position = new Vector2(
            gameObject.x - gameObject.scaleX * gameObject.displayOriginX,
            gameObject.y - gameObject.scaleY * gameObject.displayOriginY
        );

        this.prev = this.position.clone();

        this.prevFrame = this.position.clone();

        this.allowRotation = true;

        this.rotation = gameObject.angle;

        this.preRotation = gameObject.angle;

        this.width = width;

        this.height = height;

        this.sourceWidth = width;

        this.sourceHeight = height;

        if (gameObject.frame)
        {
            this.sourceWidth = gameObject.frame.realWidth;
            this.sourceHeight = gameObject.frame.realHeight;
        }

        this.halfWidth = Math.abs(width / 2);

        this.halfHeight = Math.abs(height / 2);

        this.center = new Vector2(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

        this.velocity = new Vector2();

        this.newVelocity = new Vector2();

        this.deltaMax = new Vector2();

        this.acceleration = new Vector2();

        this.allowDrag = true;

        this.drag = new Vector2();

        this.allowGravity = true;

        this.gravity = new Vector2();

        this.bounce = new Vector2();

        this.worldBounce = null;

        this.customBoundsRectangle = world.bounds;

        this.onWorldBounds = false;

        this.onCollide = false;

        this.onOverlap = false;

        this.maxVelocity = new Vector2(10000, 10000);

        this.maxSpeed = -1;

        this.friction = new Vector2(1, 0);

        this.useDamping = false;

        this.angularVelocity = 0;

        this.angularAcceleration = 0;

        this.angularDrag = 0;

        this.maxAngular = 1000;

        this.mass = 1;

        this.angle = 0;

        this.speed = 0;

        this.facing = CONST.FACING_NONE;

        this.immovable = false;

        this.pushable = true;

        this.slideFactor = new Vector2(1, 1);

        this.moves = true;

        this.customSeparateX = false;

        this.customSeparateY = false;

        this.overlapX = 0;

        this.overlapY = 0;

        this.overlapR = 0;

        this.embedded = false;

        this.collideWorldBounds = false;

        this.checkCollision = SetCollisionObject(false);

        this.touching = SetCollisionObject(true);

        this.wasTouching = SetCollisionObject(true);

        this.blocked = SetCollisionObject(true);

        this.syncBounds = false;

        this.physicsType = CONST.DYNAMIC_BODY;

        this.collisionCategory = 0x0001;

        this.collisionMask = 1;

        this._sx = gameObject.scaleX;

        this._sy = gameObject.scaleY;

        this._dx = 0;

        this._dy = 0;

        this._tx = 0;

        this._ty = 0;

        this._bounds = new Rectangle();

        this.directControl = false;

        this.autoFrame = this.position.clone();
    },

    updateBounds: function ()
    {
        var sprite = this.gameObject;

        var transform = this.transform;

        if (sprite.parentContainer)
        {
            var matrix = sprite.getWorldTransformMatrix(this.world._tempMatrix, this.world._tempMatrix2);

            transform.x = matrix.tx;
            transform.y = matrix.ty;
            transform.rotation = RadToDeg(matrix.rotation);
            transform.scaleX = matrix.scaleX;
            transform.scaleY = matrix.scaleY;
            transform.displayOriginX = sprite.displayOriginX;
            transform.displayOriginY = sprite.displayOriginY;
        }
        else
        {
            transform.x = sprite.x;
            transform.y = sprite.y;
            transform.rotation = sprite.angle;
            transform.scaleX = sprite.scaleX;
            transform.scaleY = sprite.scaleY;
            transform.displayOriginX = sprite.displayOriginX;
            transform.displayOriginY = sprite.displayOriginY;
        }

        var recalc = false;

        if (this.syncBounds)
        {
            var b = sprite.getBounds(this._bounds);

            this.width = b.width;
            this.height = b.height;
            recalc = true;
        }
        else
        {
            var asx = Math.abs(transform.scaleX);
            var asy = Math.abs(transform.scaleY);

            if (this._sx !== asx || this._sy !== asy)
            {
                this.width = this.sourceWidth * asx;
                this.height = this.sourceHeight * asy;
                this._sx = asx;
                this._sy = asy;
                recalc = true;
            }
        }

        if (recalc)
        {
            this.halfWidth = Math.floor(this.width / 2);
            this.halfHeight = Math.floor(this.height / 2);
            this.updateCenter();
        }
    },

    updateCenter: function ()
    {
        this.center.set(this.position.x + this.halfWidth, this.position.y + this.halfHeight);
    },

    updateFromGameObject: function ()
    {
        this.updateBounds();

        var transform = this.transform;

        this.position.x = transform.x + transform.scaleX * (this.offset.x - transform.displayOriginX);
        this.position.y = transform.y + transform.scaleY * (this.offset.y - transform.displayOriginY);

        this.updateCenter();
    },

    resetFlags: function (clear)
    {
        if (clear === undefined)
        {
            clear = false;
        }

        var wasTouching = this.wasTouching;
        var touching = this.touching;
        var blocked = this.blocked;

        if (clear)
        {
            SetCollisionObject(true, wasTouching);
        }
        else
        {
            wasTouching.none = touching.none;
            wasTouching.up = touching.up;
            wasTouching.down = touching.down;
            wasTouching.left = touching.left;
            wasTouching.right = touching.right;
        }

        SetCollisionObject(true, touching);
        SetCollisionObject(true, blocked);

        this.overlapR = 0;
        this.overlapX = 0;
        this.overlapY = 0;

        this.embedded = false;
    },

    preUpdate: function (willStep, delta)
    {
        if (willStep)
        {
            this.resetFlags();
        }

        if (this.gameObject)
        {
            this.updateFromGameObject();
        }

        this.rotation = this.transform.rotation;
        this.preRotation = this.rotation;

        if (this.moves)
        {
            var pos = this.position;

            this.prev.x = pos.x;
            this.prev.y = pos.y;

            this.prevFrame.x = pos.x;
            this.prevFrame.y = pos.y;
        }

        if (willStep)
        {
            this.update(delta);
        }
    },

    update: function (delta)
    {
        var prev = this.prev;
        var pos = this.position;
        var vel = this.velocity;

        prev.set(pos.x, pos.y);

        if (!this.moves)
        {
            this._dx = pos.x - prev.x;
            this._dy = pos.y - prev.y;

            return;
        }

        if (this.directControl)
        {
            var autoFrame = this.autoFrame;

            vel.set(
                (pos.x - autoFrame.x) / delta,
                (pos.y - autoFrame.y) / delta
            );

            this.world.updateMotion(this, delta);

            this._dx = pos.x - autoFrame.x;
            this._dy = pos.y - autoFrame.y;
        }
        else
        {
            this.world.updateMotion(this, delta);

            this.newVelocity.set(vel.x * delta, vel.y * delta);

            pos.add(this.newVelocity);

            this._dx = pos.x - prev.x;
            this._dy = pos.y - prev.y;
        }

        var vx = vel.x;
        var vy = vel.y;

        this.updateCenter();

        this.angle = Math.atan2(vy, vx);
        this.speed = Math.sqrt(vx * vx + vy * vy);

        if (this.collideWorldBounds && this.checkWorldBounds() && this.onWorldBounds)
        {
            var blocked = this.blocked;

            this.world.emit(Events.WORLD_BOUNDS, this, blocked.up, blocked.down, blocked.left, blocked.right);
        }
    },

    postUpdate: function ()
    {
        var pos = this.position;

        var dx = pos.x - this.prevFrame.x;
        var dy = pos.y - this.prevFrame.y;

        var gameObject = this.gameObject;

        if (this.moves)
        {
            var mx = this.deltaMax.x;
            var my = this.deltaMax.y;

            if (mx !== 0 && dx !== 0)
            {
                if (dx < 0 && dx < -mx)
                {
                    dx = -mx;
                }
                else if (dx > 0 && dx > mx)
                {
                    dx = mx;
                }
            }

            if (my !== 0 && dy !== 0)
            {
                if (dy < 0 && dy < -my)
                {
                    dy = -my;
                }
                else if (dy > 0 && dy > my)
                {
                    dy = my;
                }
            }

            if (gameObject)
            {
                gameObject.x += dx;
                gameObject.y += dy;
            }
        }

        if (dx < 0)
        {
            this.facing = CONST.FACING_LEFT;
        }
        else if (dx > 0)
        {
            this.facing = CONST.FACING_RIGHT;
        }

        if (dy < 0)
        {
            this.facing = CONST.FACING_UP;
        }
        else if (dy > 0)
        {
            this.facing = CONST.FACING_DOWN;
        }

        if (this.allowRotation && gameObject)
        {
            gameObject.angle += this.deltaZ();
        }

        this._tx = dx;
        this._ty = dy;

        this.autoFrame.set(pos.x, pos.y);
    },

    setBoundsRectangle: function (bounds)
    {
        this.customBoundsRectangle = (!bounds) ? this.world.bounds : bounds;

        return this;
    },

    checkWorldBounds: function ()
    {
        var pos = this.position;
        var vel = this.velocity;
        var blocked = this.blocked;
        var bounds = this.customBoundsRectangle;
        var check = this.world.checkCollision;

        var bx = (this.worldBounce) ? -this.worldBounce.x : -this.bounce.x;
        var by = (this.worldBounce) ? -this.worldBounce.y : -this.bounce.y;

        var wasSet = false;

        if (pos.x < bounds.x && check.left)
        {
            pos.x = bounds.x;
            vel.x *= bx;
            blocked.left = true;
            wasSet = true;
        }
        else if (this.right > bounds.right && check.right)
        {
            pos.x = bounds.right - this.width;
            vel.x *= bx;
            blocked.right = true;
            wasSet = true;
        }

        if (pos.y < bounds.y && check.up)
        {
            pos.y = bounds.y;
            vel.y *= by;
            blocked.up = true;
            wasSet = true;
        }
        else if (this.bottom > bounds.bottom && check.down)
        {
            pos.y = bounds.bottom - this.height;
            vel.y *= by;
            blocked.down = true;
            wasSet = true;
        }

        if (wasSet)
        {
            this.blocked.none = false;
            this.updateCenter();
        }

        return wasSet;
    },

    setOffset: function (x, y)
    {
        if (y === undefined) { y = x; }

        this.offset.set(x, y);

        return this;
    },

    setGameObject: function (gameObject, enable)
    {
        if (enable === undefined) { enable = true; }

        if (!gameObject || !gameObject.hasTransformComponent)
        {

            return this;
        }

        var world = this.world;

        if (this.gameObject && this.gameObject.body)
        {
            world.disable(this.gameObject);

            this.gameObject.body = null;
        }

        if (gameObject.body)
        {

            world.disable(gameObject);
        }

        this.gameObject = gameObject;

        gameObject.body = this;

        this.setSize();

        this.enable = enable;

        return this;
    },

    setSize: function (width, height, center)
    {
        if (center === undefined) { center = true; }

        var gameObject = this.gameObject;

        if (gameObject)
        {
            if (!width && gameObject.frame)
            {
                width = gameObject.frame.realWidth;
            }

            if (!height && gameObject.frame)
            {
                height = gameObject.frame.realHeight;
            }
        }

        this.sourceWidth = width;
        this.sourceHeight = height;

        this.width = this.sourceWidth * this._sx;
        this.height = this.sourceHeight * this._sy;

        this.halfWidth = Math.floor(this.width / 2);
        this.halfHeight = Math.floor(this.height / 2);

        this.updateCenter();

        if (center && gameObject && gameObject.getCenter)
        {
            var ox = (gameObject.width - width) / 2;
            var oy = (gameObject.height - height) / 2;

            this.offset.set(ox, oy);
        }

        this.isCircle = false;
        this.radius = 0;

        return this;
    },

    setCircle: function (radius, offsetX, offsetY)
    {
        if (offsetX === undefined) { offsetX = this.offset.x; }
        if (offsetY === undefined) { offsetY = this.offset.y; }

        if (radius > 0)
        {
            this.isCircle = true;
            this.radius = radius;

            this.sourceWidth = radius * 2;
            this.sourceHeight = radius * 2;

            this.width = this.sourceWidth * this._sx;
            this.height = this.sourceHeight * this._sy;

            this.halfWidth = Math.floor(this.width / 2);
            this.halfHeight = Math.floor(this.height / 2);

            this.offset.set(offsetX, offsetY);

            this.updateCenter();
        }
        else
        {
            this.isCircle = false;
        }

        return this;
    },

    reset: function (x, y)
    {
        this.stop();

        var gameObject = this.gameObject;

        if (gameObject)
        {
            gameObject.setPosition(x, y);

            this.rotation = gameObject.angle;
            this.preRotation = gameObject.angle;
        }

        var pos = this.position;

        if (gameObject && gameObject.getTopLeft)
        {
            gameObject.getTopLeft(pos);
        }
        else
        {
            pos.set(x, y);
        }

        this.prev.copy(pos);
        this.prevFrame.copy(pos);
        this.autoFrame.copy(pos);

        if (gameObject)
        {
            this.updateBounds();
        }

        this.updateCenter();

        if (this.collideWorldBounds)
        {
            this.checkWorldBounds();
        }

        this.resetFlags(true);
    },

    stop: function ()
    {
        this.velocity.set(0);
        this.acceleration.set(0);
        this.speed = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;

        return this;
    },

    getBounds: function (obj)
    {
        obj.x = this.x;
        obj.y = this.y;
        obj.right = this.right;
        obj.bottom = this.bottom;

        return obj;
    },

    hitTest: function (x, y)
    {
        if (!this.isCircle)
        {
            return RectangleContains(this, x, y);
        }

        if (this.radius > 0 && x >= this.left && x <= this.right && y >= this.top && y <= this.bottom)
        {
            var dx = (this.center.x - x) * (this.center.x - x);
            var dy = (this.center.y - y) * (this.center.y - y);

            return (dx + dy) <= (this.radius * this.radius);
        }

        return false;
    },

    onFloor: function ()
    {
        return this.blocked.down;
    },

    onCeiling: function ()
    {
        return this.blocked.up;
    },

    onWall: function ()
    {
        return (this.blocked.left || this.blocked.right);
    },

    deltaAbsX: function ()
    {
        return (this._dx > 0) ? this._dx : -this._dx;
    },

    deltaAbsY: function ()
    {
        return (this._dy > 0) ? this._dy : -this._dy;
    },

    deltaX: function ()
    {
        return this._dx;
    },

    deltaY: function ()
    {
        return this._dy;
    },

    deltaXFinal: function ()
    {
        return this._tx;
    },

    deltaYFinal: function ()
    {
        return this._ty;
    },

    deltaZ: function ()
    {
        return this.rotation - this.preRotation;
    },

    destroy: function ()
    {
        this.enable = false;

        if (this.world)
        {
            this.world.pendingDestroy.set(this);
        }
    },

    drawDebug: function (graphic)
    {
        var pos = this.position;

        var x = pos.x + this.halfWidth;
        var y = pos.y + this.halfHeight;

        if (this.debugShowBody)
        {
            graphic.lineStyle(graphic.defaultStrokeWidth, this.debugBodyColor);

            if (this.isCircle)
            {
                graphic.strokeCircle(x, y, this.width / 2);
            }
            else
            {

                if (this.checkCollision.up)
                {
                    graphic.lineBetween(pos.x, pos.y, pos.x + this.width, pos.y);
                }

                if (this.checkCollision.right)
                {
                    graphic.lineBetween(pos.x + this.width, pos.y, pos.x + this.width, pos.y + this.height);
                }

                if (this.checkCollision.down)
                {
                    graphic.lineBetween(pos.x, pos.y + this.height, pos.x + this.width, pos.y + this.height);
                }

                if (this.checkCollision.left)
                {
                    graphic.lineBetween(pos.x, pos.y, pos.x, pos.y + this.height);
                }
            }
        }

        if (this.debugShowVelocity)
        {
            graphic.lineStyle(graphic.defaultStrokeWidth, this.world.defaults.velocityDebugColor, 1);
            graphic.lineBetween(x, y, x + this.velocity.x / 2, y + this.velocity.y / 2);
        }
    },

    willDrawDebug: function ()
    {
        return (this.debugShowBody || this.debugShowVelocity);
    },

    setDirectControl: function (value)
    {
        if (value === undefined) { value = true; }

        this.directControl = value;

        return this;
    },

    setCollideWorldBounds: function (value, bounceX, bounceY, onWorldBounds)
    {
        if (value === undefined) { value = true; }

        this.collideWorldBounds = value;

        var setBounceX = (bounceX !== undefined);
        var setBounceY = (bounceY !== undefined);

        if (setBounceX || setBounceY)
        {
            if (!this.worldBounce)
            {
                this.worldBounce = new Vector2();
            }

            if (setBounceX)
            {
                this.worldBounce.x = bounceX;
            }

            if (setBounceY)
            {
                this.worldBounce.y = bounceY;
            }
        }

        if (onWorldBounds !== undefined)
        {
            this.onWorldBounds = onWorldBounds;
        }

        return this;
    },

    setVelocity: function (x, y)
    {
        this.velocity.set(x, y);

        x = this.velocity.x;
        y = this.velocity.y;

        this.speed = Math.sqrt(x * x + y * y);

        return this;
    },

    setVelocityX: function (value)
    {
        return this.setVelocity(value, this.velocity.y);
    },

    setVelocityY: function (value)
    {
        return this.setVelocity(this.velocity.x, value);
    },

    setMaxVelocity: function (x, y)
    {
        this.maxVelocity.set(x, y);

        return this;
    },

    setMaxVelocityX: function (value)
    {
        this.maxVelocity.x = value;

        return this;
    },

    setMaxVelocityY: function (value)
    {
        this.maxVelocity.y = value;

        return this;
    },

    setMaxSpeed: function (value)
    {
        this.maxSpeed = value;

        return this;
    },

    setSlideFactor: function (x, y)
    {
        this.slideFactor.set(x, y);

        return this;
    },

    setBounce: function (x, y)
    {
        this.bounce.set(x, y);

        return this;
    },

    setBounceX: function (value)
    {
        this.bounce.x = value;

        return this;
    },

    setBounceY: function (value)
    {
        this.bounce.y = value;

        return this;
    },

    setAcceleration: function (x, y)
    {
        this.acceleration.set(x, y);

        return this;
    },

    setAccelerationX: function (value)
    {
        this.acceleration.x = value;

        return this;
    },

    setAccelerationY: function (value)
    {
        this.acceleration.y = value;

        return this;
    },

    setAllowDrag: function (value)
    {
        if (value === undefined) { value = true; }

        this.allowDrag = value;

        return this;
    },

    setAllowGravity: function (value)
    {
        if (value === undefined) { value = true; }

        this.allowGravity = value;

        return this;
    },

    setAllowRotation: function (value)
    {
        if (value === undefined) { value = true; }

        this.allowRotation = value;

        return this;
    },

    setDrag: function (x, y)
    {
        this.drag.set(x, y);

        return this;
    },

    setDamping: function (value)
    {
        this.useDamping = value;

        return this;
    },

    setDragX: function (value)
    {
        this.drag.x = value;

        return this;
    },

    setDragY: function (value)
    {
        this.drag.y = value;

        return this;
    },

    setGravity: function (x, y)
    {
        this.gravity.set(x, y);

        return this;
    },

    setGravityX: function (value)
    {
        this.gravity.x = value;

        return this;
    },

    setGravityY: function (value)
    {
        this.gravity.y = value;

        return this;
    },

    setFriction: function (x, y)
    {
        this.friction.set(x, y);

        return this;
    },

    setFrictionX: function (value)
    {
        this.friction.x = value;

        return this;
    },

    setFrictionY: function (value)
    {
        this.friction.y = value;

        return this;
    },

    setAngularVelocity: function (value)
    {
        this.angularVelocity = value;

        return this;
    },

    setAngularAcceleration: function (value)
    {
        this.angularAcceleration = value;

        return this;
    },

    setAngularDrag: function (value)
    {
        this.angularDrag = value;

        return this;
    },

    setMass: function (value)
    {
        this.mass = value;

        return this;
    },

    setImmovable: function (value)
    {
        if (value === undefined) { value = true; }

        this.immovable = value;

        return this;
    },

    setEnable: function (value)
    {
        if (value === undefined) { value = true; }

        this.enable = value;

        return this;
    },

    processX: function (x, vx, left, right)
    {
        this.x += x;

        this.updateCenter();

        if (vx !== null)
        {
            this.velocity.x = vx * this.slideFactor.x;
        }

        var blocked = this.blocked;

        if (left)
        {
            blocked.left = true;
            blocked.none = false;
        }

        if (right)
        {
            blocked.right = true;
            blocked.none = false;
        }
    },

    processY: function (y, vy, up, down)
    {
        this.y += y;

        this.updateCenter();

        if (vy !== null)
        {
            this.velocity.y = vy * this.slideFactor.y;
        }

        var blocked = this.blocked;

        if (up)
        {
            blocked.up = true;
            blocked.none = false;
        }

        if (down)
        {
            blocked.down = true;
            blocked.none = false;
        }
    },

    x: {

        get: function ()
        {
            return this.position.x;
        },

        set: function (value)
        {
            this.position.x = value;
        }

    },

    y: {

        get: function ()
        {
            return this.position.y;
        },

        set: function (value)
        {
            this.position.y = value;
        }

    },

    left: {

        get: function ()
        {
            return this.position.x;
        }

    },

    right: {

        get: function ()
        {
            return this.position.x + this.width;
        }

    },

    top: {

        get: function ()
        {
            return this.position.y;
        }

    },

    bottom: {

        get: function ()
        {
            return this.position.y + this.height;
        }

    }

});

module.exports = Body;
