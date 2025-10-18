var Class = require('../../utils/Class');
var Components = require('../components');
var ComponentsToJSON = require('../components/ToJSON');
var CopyFrom = require('../../geom/rectangle/CopyFrom');
var DeathZone = require('./zones/DeathZone');
var EdgeZone = require('./zones/EdgeZone');
var EmitterColorOp = require('./EmitterColorOp');
var EmitterOp = require('./EmitterOp');
var Events = require('./events');
var GameObject = require('../GameObject');
var GetFastValue = require('../../utils/object/GetFastValue');
var GetRandom = require('../../utils/array/GetRandom');
var GravityWell = require('./GravityWell');
var HasAll = require('../../utils/object/HasAll');
var HasAny = require('../../utils/object/HasAny');
var HasValue = require('../../utils/object/HasValue');
var Inflate = require('../../geom/rectangle/Inflate');
var List = require('../../structs/List');
var MergeRect = require('../../geom/rectangle/MergeRect');
var MergeRight = require('../../utils/object/MergeRight');
var Particle = require('./Particle');
var ParticleBounds = require('./ParticleBounds');
var RandomZone = require('./zones/RandomZone');
var Rectangle = require('../../geom/rectangle/Rectangle');
var RectangleToRectangle = require('../../geom/intersects/RectangleToRectangle');
var Remove = require('../../utils/array/Remove');
var Render = require('./ParticleEmitterRender');
var StableSort = require('../../utils/array/StableSort');
var TransformMatrix = require('../components/TransformMatrix');
var Vector2 = require('../../math/Vector2');
var Wrap = require('../../math/Wrap');

var configFastMap = [
    'active',
    'advance',
    'blendMode',
    'colorEase',
    'deathCallback',
    'deathCallbackScope',
    'duration',
    'emitCallback',
    'emitCallbackScope',
    'follow',
    'frequency',
    'gravityX',
    'gravityY',
    'maxAliveParticles',
    'maxParticles',
    'name',
    'emitting',
    'particleBringToTop',
    'particleClass',
    'radial',
    'sortCallback',
    'sortOrderAsc',
    'sortProperty',
    'stopAfter',
    'tintFill',
    'timeScale',
    'trackVisible',
    'visible'
];

var configOpMap = [
    'accelerationX',
    'accelerationY',
    'alpha',
    'angle',
    'bounce',
    'color',
    'delay',
    'hold',
    'lifespan',
    'maxVelocityX',
    'maxVelocityY',
    'moveToX',
    'moveToY',
    'quantity',
    'rotate',
    'scaleX',
    'scaleY',
    'speedX',
    'speedY',
    'tint',
    'x',
    'y'
];

var ParticleEmitter = new Class({

    Extends: GameObject,

    Mixins: [
        Components.AlphaSingle,
        Components.BlendMode,
        Components.Depth,
        Components.Mask,
        Components.Pipeline,
        Components.PostPipeline,
        Components.ScrollFactor,
        Components.Texture,
        Components.Transform,
        Components.Visible,
        Render
    ],

    initialize:

    function ParticleEmitter (scene, x, y, texture, config)
    {
        GameObject.call(this, scene, 'ParticleEmitter');

        this.particleClass = Particle;

        this.config = null;

        this.ops = {
            accelerationX: new EmitterOp('accelerationX', 0),
            accelerationY: new EmitterOp('accelerationY', 0),
            alpha: new EmitterOp('alpha', 1),
            angle: new EmitterOp('angle', { min: 0, max: 360 }, true),
            bounce: new EmitterOp('bounce', 0),
            color: new EmitterColorOp('color'),
            delay: new EmitterOp('delay', 0, true),
            hold: new EmitterOp('hold', 0, true),
            lifespan: new EmitterOp('lifespan', 1000, true),
            maxVelocityX: new EmitterOp('maxVelocityX', 10000),
            maxVelocityY: new EmitterOp('maxVelocityY', 10000),
            moveToX: new EmitterOp('moveToX', 0),
            moveToY: new EmitterOp('moveToY', 0),
            quantity: new EmitterOp('quantity', 1, true),
            rotate: new EmitterOp('rotate', 0),
            scaleX: new EmitterOp('scaleX', 1),
            scaleY: new EmitterOp('scaleY', 1),
            speedX: new EmitterOp('speedX', 0, true),
            speedY: new EmitterOp('speedY', 0, true),
            tint: new EmitterOp('tint', 0xffffff),
            x: new EmitterOp('x', 0),
            y: new EmitterOp('y', 0)
        };

        this.radial = true;

        this.gravityX = 0;

        this.gravityY = 0;

        this.acceleration = false;

        this.moveTo = false;

        this.emitCallback = null;

        this.emitCallbackScope = null;

        this.deathCallback = null;

        this.deathCallbackScope = null;

        this.maxParticles = 0;

        this.maxAliveParticles = 0;

        this.stopAfter = 0;

        this.duration = 0;

        this.frequency = 0;

        this.emitting = true;

        this.particleBringToTop = true;

        this.timeScale = 1;

        this.emitZones = [];

        this.deathZones = [];

        this.viewBounds = null;

        this.follow = null;

        this.followOffset = new Vector2();

        this.trackVisible = false;

        this.frames = [];

        this.randomFrame = true;

        this.frameQuantity = 1;

        this.anims = [];

        this.randomAnim = true;

        this.animQuantity = 1;

        this.dead = [];

        this.alive = [];

        this.counters = new Float32Array(10);

        this.skipping = false;

        this.worldMatrix = new TransformMatrix();

        this.sortProperty = '';

        this.sortOrderAsc = true;

        this.sortCallback = this.depthSortCallback;

        this.processors = new List(this);

        this.tintFill = false;

        this.initPipeline();
        this.initPostPipeline();

        this.setPosition(x, y);
        this.setTexture(texture);

        if (config)
        {
            this.setConfig(config);
        }
    },

    addedToScene: function ()
    {
        this.scene.sys.updateList.add(this);
    },

    removedFromScene: function ()
    {
        this.scene.sys.updateList.remove(this);
    },

    setConfig: function (config)
    {
        if (!config)
        {
            return this;
        }

        this.config = config;

        var i = 0;
        var key = '';

        var ops = this.ops;

        for (i = 0; i < configOpMap.length; i++)
        {
            key = configOpMap[i];

            ops[key].loadConfig(config);
        }

        for (i = 0; i < configFastMap.length; i++)
        {
            key = configFastMap[i];

            if (HasValue(config, key))
            {
                this[key] = GetFastValue(config, key);
            }
        }

        this.acceleration = (this.accelerationX !== 0 || this.accelerationY !== 0);

        this.moveTo = HasAll(config, [ 'moveToX', 'moveToY' ]);

        if (HasValue(config, 'speed'))
        {
            ops.speedX.loadConfig(config, 'speed');
            ops.speedY.active = false;
        }

        if (HasAny(config, [ 'speedX', 'speedY' ]) || this.moveTo)
        {
            this.radial = false;
        }

        if (HasValue(config, 'scale'))
        {
            ops.scaleX.loadConfig(config, 'scale');
            ops.scaleY.active = false;
        }

        if (HasValue(config, 'callbackScope'))
        {
            var callbackScope = GetFastValue(config, 'callbackScope', null);

            this.emitCallbackScope = callbackScope;
            this.deathCallbackScope = callbackScope;
        }

        if (HasValue(config, 'emitZone'))
        {
            this.addEmitZone(config.emitZone);
        }

        if (HasValue(config, 'deathZone'))
        {
            this.addDeathZone(config.deathZone);
        }

        if (HasValue(config, 'bounds'))
        {
            var bounds = this.addParticleBounds(config.bounds);

            bounds.collideLeft = GetFastValue(config, 'collideLeft', true);
            bounds.collideRight = GetFastValue(config, 'collideRight', true);
            bounds.collideTop = GetFastValue(config, 'collideTop', true);
            bounds.collideBottom = GetFastValue(config, 'collideBottom', true);
        }

        if (HasValue(config, 'followOffset'))
        {
            this.followOffset.setFromObject(GetFastValue(config, 'followOffset', 0));
        }

        if (HasValue(config, 'texture'))
        {
            this.setTexture(config.texture);
        }

        if (HasValue(config, 'frame'))
        {
            this.setEmitterFrame(config.frame);
        }
        else if (HasValue(config, 'anim'))
        {
            this.setAnim(config.anim);
        }

        if (HasValue(config, 'reserve'))
        {
            this.reserve(config.reserve);
        }

        if (HasValue(config, 'advance'))
        {
            this.fastForward(config.advance);
        }

        this.resetCounters(this.frequency, this.emitting);

        if (this.emitting)
        {
            this.emit(Events.START, this);
        }

        return this;
    },

    updateConfig: function (config)
    {
        if (config)
        {
            if (!this.config)
            {
                this.setConfig(config);
            }
            else
            {
                this.setConfig(MergeRight(this.config, config));
            }
        }

        return this;
    },

    toJSON: function ()
    {
        var output = ComponentsToJSON(this);

        var i = 0;
        var key = '';

        for (i = 0; i < configFastMap.length; i++)
        {
            key = configFastMap[i];

            output[key] = this[key];
        }

        var ops = this.ops;

        for (i = 0; i < configOpMap.length; i++)
        {
            key = configOpMap[i];

            if (ops[key])
            {
                output[key] = ops[key].toJSON();
            }
        }

        if (!ops.speedY.active)
        {
            delete output.speedX;
            output.speed = ops.speedX.toJSON();
        }

        if (this.scaleX === this.scaleY)
        {
            delete output.scaleX;
            delete output.scaleY;
            output.scale = ops.scaleX.toJSON();
        }

        return output;
    },

    resetCounters: function (frequency, on)
    {
        var counters = this.counters;

        counters.fill(0);

        counters[0] = frequency;

        if (on)
        {
            counters[5] = 1;
        }
    },

    startFollow: function (target, offsetX, offsetY, trackVisible)
    {
        if (offsetX === undefined) { offsetX = 0; }
        if (offsetY === undefined) { offsetY = 0; }
        if (trackVisible === undefined) { trackVisible = false; }

        this.follow = target;
        this.followOffset.set(offsetX, offsetY);
        this.trackVisible = trackVisible;

        return this;
    },

    stopFollow: function ()
    {
        this.follow = null;
        this.followOffset.set(0, 0);
        this.trackVisible = false;

        return this;
    },

    getFrame: function ()
    {
        var frames = this.frames;
        var len = frames.length;
        var current;

        if (len === 1)
        {
            current = frames[0];
        }
        else if (this.randomFrame)
        {
            current = GetRandom(frames);
        }
        else
        {
            current = frames[this.currentFrame];

            this.frameCounter++;

            if (this.frameCounter === this.frameQuantity)
            {
                this.frameCounter = 0;

                this.currentFrame++;

                if (this.currentFrame === len)
                {
                    this.currentFrame = 0;
                }
            }
        }

        return this.texture.get(current);
    },

    setEmitterFrame: function (frames, pickRandom, quantity)
    {
        if (pickRandom === undefined) { pickRandom = true; }
        if (quantity === undefined) { quantity = 1; }

        this.randomFrame = pickRandom;
        this.frameQuantity = quantity;

        this.currentFrame = 0;

        var t = typeof (frames);

        this.frames.length = 0;

        if (Array.isArray(frames))
        {
            this.frames = this.frames.concat(frames);
        }
        else if (t === 'string' || t === 'number')
        {
            this.frames.push(frames);
        }
        else if (t === 'object')
        {
            var frameConfig = frames;

            frames = GetFastValue(frameConfig, 'frames', null);

            if (frames)
            {
                this.frames = this.frames.concat(frames);
            }

            var isCycle = GetFastValue(frameConfig, 'cycle', false);

            this.randomFrame = (isCycle) ? false : true;

            this.frameQuantity = GetFastValue(frameConfig, 'quantity', quantity);
        }

        if (this.frames.length === 1)
        {
            this.frameQuantity = 1;
            this.randomFrame = false;
        }

        return this;
    },

    getAnim: function ()
    {
        var anims = this.anims;
        var len = anims.length;

        if (len === 0)
        {
            return null;
        }
        else if (len === 1)
        {
            return anims[0];
        }
        else if (this.randomAnim)
        {
            return GetRandom(anims);
        }
        else
        {
            var anim = anims[this.currentAnim];

            this.animCounter++;

            if (this.animCounter >= this.animQuantity)
            {
                this.animCounter = 0;
                this.currentAnim = Wrap(this.currentAnim + 1, 0, len);
            }

            return anim;
        }
    },

    setAnim: function (anims, pickRandom, quantity)
    {
        if (pickRandom === undefined) { pickRandom = true; }
        if (quantity === undefined) { quantity = 1; }

        this.randomAnim = pickRandom;
        this.animQuantity = quantity;

        this.currentAnim = 0;

        var t = typeof (anims);

        this.anims.length = 0;

        if (Array.isArray(anims))
        {
            this.anims = this.anims.concat(anims);
        }
        else if (t === 'string')
        {
            this.anims.push(anims);
        }
        else if (t === 'object')
        {
            var animConfig = anims;

            anims = GetFastValue(animConfig, 'anims', null);

            if (anims)
            {
                this.anims = this.anims.concat(anims);
            }

            var isCycle = GetFastValue(animConfig, 'cycle', false);

            this.randomAnim = (isCycle) ? false : true;

            this.animQuantity = GetFastValue(animConfig, 'quantity', quantity);
        }

        if (this.anims.length === 1)
        {
            this.animQuantity = 1;
            this.randomAnim = false;
        }

        return this;
    },

    setRadial: function (value)
    {
        if (value === undefined) { value = true; }

        this.radial = value;

        return this;
    },

    addParticleBounds: function (x, y, width, height, collideLeft, collideRight, collideTop, collideBottom)
    {
        if (typeof x === 'object')
        {
            var obj = x;

            x = obj.x;
            y = obj.y;
            width = (HasValue(obj, 'w')) ? obj.w : obj.width;
            height = (HasValue(obj, 'h')) ? obj.h : obj.height;
        }

        return this.addParticleProcessor(new ParticleBounds(x, y, width, height, collideLeft, collideRight, collideTop, collideBottom));
    },

    setParticleSpeed: function (x, y)
    {
        if (y === undefined) { y = x; }

        this.ops.speedX.onChange(x);

        if (x === y)
        {
            this.ops.speedY.active = false;
        }
        else
        {
            this.ops.speedY.onChange(y);
        }

        this.radial = true;

        return this;
    },

    setParticleScale: function (x, y)
    {
        if (x === undefined) { x = 1; }
        if (y === undefined) { y = x; }

        this.ops.scaleX.onChange(x);
        this.ops.scaleY.onChange(y);

        return this;
    },

    setParticleGravity: function (x, y)
    {
        this.gravityX = x;
        this.gravityY = y;

        return this;
    },

    setParticleAlpha: function (value)
    {
        this.ops.alpha.onChange(value);

        return this;
    },

    setParticleTint: function (value)
    {
        this.ops.tint.onChange(value);

        return this;
    },

    setEmitterAngle: function (value)
    {
        this.ops.angle.onChange(value);

        return this;
    },

    setParticleLifespan: function (value)
    {
        this.ops.lifespan.onChange(value);

        return this;
    },

    setQuantity: function (quantity)
    {
        this.quantity = quantity;

        return this;
    },

    setFrequency: function (frequency, quantity)
    {
        this.frequency = frequency;

        this.flowCounter = (frequency > 0) ? frequency : 0;

        if (quantity)
        {
            this.quantity = quantity;
        }

        return this;
    },

    addDeathZone: function (config)
    {
        if (!Array.isArray(config))
        {
            config = [ config ];
        }

        var zone;
        var output = [];

        for (var i = 0; i < config.length; i++)
        {
            zone = config[i];

            if (zone instanceof DeathZone)
            {
                output.push(zone);
            }
            else if (typeof zone.contains === 'function')
            {
                zone = new DeathZone(zone, true);

                output.push(zone);
            }
            else
            {
                var type = GetFastValue(zone, 'type', 'onEnter');
                var source = GetFastValue(zone, 'source', null);

                if (source && typeof source.contains === 'function')
                {
                    var killOnEnter = (type === 'onEnter') ? true : false;

                    zone = new DeathZone(source, killOnEnter);

                    output.push(zone);
                }
            }
        }

        this.deathZones = this.deathZones.concat(output);

        return output;
    },

    removeDeathZone: function (zone)
    {
        Remove(this.deathZones, zone);

        return this;
    },

    clearDeathZones: function ()
    {
        this.deathZones.length = 0;

        return this;
    },

    addEmitZone: function (config)
    {
        if (!Array.isArray(config))
        {
            config = [ config ];
        }

        var zone;
        var output = [];

        for (var i = 0; i < config.length; i++)
        {
            zone = config[i];

            if (zone instanceof RandomZone || zone instanceof EdgeZone)
            {
                output.push(zone);
            }
            else
            {

                var source = GetFastValue(zone, 'source', null);

                if (source)
                {
                    var type = GetFastValue(zone, 'type', 'random');

                    if (type === 'random' && typeof source.getRandomPoint === 'function')
                    {
                        zone = new RandomZone(source);

                        output.push(zone);
                    }
                    else if (type === 'edge' && typeof source.getPoints === 'function')
                    {
                        var quantity = GetFastValue(zone, 'quantity', 1);
                        var stepRate = GetFastValue(zone, 'stepRate', 0);
                        var yoyo = GetFastValue(zone, 'yoyo', false);
                        var seamless = GetFastValue(zone, 'seamless', true);
                        var total = GetFastValue(zone, 'total', -1);

                        zone = new EdgeZone(source, quantity, stepRate, yoyo, seamless, total);

                        output.push(zone);
                    }
                }
            }
        }

        this.emitZones = this.emitZones.concat(output);

        return output;
    },

    removeEmitZone: function (zone)
    {
        Remove(this.emitZones, zone);

        this.zoneIndex = 0;

        return this;
    },

    clearEmitZones: function ()
    {
        this.emitZones.length = 0;

        this.zoneIndex = 0;

        return this;
    },

    getEmitZone: function (particle)
    {
        var zones = this.emitZones;
        var len = zones.length;

        if (len === 0)
        {
            return;
        }
        else
        {
            var zone = zones[this.zoneIndex];

            zone.getPoint(particle);

            if (zone.total > -1)
            {
                this.zoneTotal++;

                if (this.zoneTotal === zone.total)
                {
                    this.zoneTotal = 0;

                    this.zoneIndex++;

                    if (this.zoneIndex === len)
                    {
                        this.zoneIndex = 0;
                    }
                }
            }
        }
    },

    getDeathZone: function (particle)
    {
        var zones = this.deathZones;

        for (var i = 0; i < zones.length; i++)
        {
            var zone = zones[i];

            if (zone.willKill(particle))
            {
                this.emit(Events.DEATH_ZONE, this, particle, zone);

                return true;
            }
        }

        return false;
    },

    setEmitZone: function (zone)
    {
        var index;

        if (isFinite(zone))
        {
            index = zone;
        }
        else
        {
            index = this.emitZones.indexOf(zone);
        }

        if (index >= 0)
        {
            this.zoneIndex = index;
        }

        return this;
    },

    addParticleProcessor: function (processor)
    {
        if (!this.processors.exists(processor))
        {
            if (processor.emitter)
            {
                processor.emitter.removeParticleProcessor(processor);
            }

            this.processors.add(processor);

            processor.emitter = this;
        }

        return processor;
    },

    removeParticleProcessor: function (processor)
    {
        if (this.processors.exists(processor))
        {
            this.processors.remove(processor, true);

            processor.emitter = null;
        }

        return processor;
    },

    getProcessors: function ()
    {
        return this.processors.getAll('active', true);
    },

    createGravityWell: function (config)
    {
        return this.addParticleProcessor(new GravityWell(config));
    },

    reserve: function (count)
    {
        var dead = this.dead;

        if (this.maxParticles > 0)
        {
            var total = this.getParticleCount();

            if (total + count > this.maxParticles)
            {
                count = this.maxParticles - (total + count);
            }
        }

        for (var i = 0; i < count; i++)
        {
            dead.push(new this.particleClass(this));
        }

        return this;
    },

    getAliveParticleCount: function ()
    {
        return this.alive.length;
    },

    getDeadParticleCount: function ()
    {
        return this.dead.length;
    },

    getParticleCount: function ()
    {
        return this.getAliveParticleCount() + this.getDeadParticleCount();
    },

    atLimit: function ()
    {
        if (this.maxParticles > 0 && this.getParticleCount() >= this.maxParticles)
        {
            return true;
        }

        return (this.maxAliveParticles > 0 && this.getAliveParticleCount() >= this.maxAliveParticles);
    },

    onParticleEmit: function (callback, context)
    {
        if (callback === undefined)
        {

            this.emitCallback = null;
            this.emitCallbackScope = null;
        }
        else if (typeof callback === 'function')
        {
            this.emitCallback = callback;

            if (context)
            {
                this.emitCallbackScope = context;
            }
        }

        return this;
    },

    onParticleDeath: function (callback, context)
    {
        if (callback === undefined)
        {

            this.deathCallback = null;
            this.deathCallbackScope = null;
        }
        else if (typeof callback === 'function')
        {
            this.deathCallback = callback;

            if (context)
            {
                this.deathCallbackScope = context;
            }
        }

        return this;
    },

    killAll: function ()
    {
        var dead = this.dead;
        var alive = this.alive;

        while (alive.length > 0)
        {
            dead.push(alive.pop());
        }

        return this;
    },

    forEachAlive: function (callback, context)
    {
        var alive = this.alive;
        var length = alive.length;

        for (var i = 0; i < length; i++)
        {

            callback.call(context, alive[i], this);
        }

        return this;
    },

    forEachDead: function (callback, context)
    {
        var dead = this.dead;
        var length = dead.length;

        for (var i = 0; i < length; i++)
        {
            callback.call(context, dead[i], this);
        }

        return this;
    },

    start: function (advance, duration)
    {
        if (advance === undefined) { advance = 0; }

        if (!this.emitting)
        {
            if (advance > 0)
            {
                this.fastForward(advance);
            }

            this.emitting = true;

            this.resetCounters(this.frequency, true);

            if (duration !== undefined)
            {
                this.duration = Math.abs(duration);
            }

            this.emit(Events.START, this);
        }

        return this;
    },

    stop: function (kill)
    {
        if (kill === undefined) { kill = false; }

        if (this.emitting)
        {
            this.emitting = false;

            if (kill)
            {
                this.killAll();
            }

            this.emit(Events.STOP, this);
        }

        return this;
    },

    pause: function ()
    {
        this.active = false;

        return this;
    },

    resume: function ()
    {
        this.active = true;

        return this;
    },

    setSortProperty: function (property, ascending)
    {
        if (property === undefined) { property = ''; }
        if (ascending === undefined) { ascending = this.true; }

        this.sortProperty = property;
        this.sortOrderAsc = ascending;
        this.sortCallback = this.depthSortCallback;

        return this;
    },

    setSortCallback: function (callback)
    {
        if (this.sortProperty !== '')
        {
            callback = this.depthSortCallback;
        }
        else
        {
            callback = null;
        }

        this.sortCallback = callback;

        return this;
    },

    depthSort: function ()
    {
        StableSort(this.alive, this.sortCallback.bind(this));

        return this;
    },

    depthSortCallback: function (a, b)
    {
        var key = this.sortProperty;

        if (this.sortOrderAsc)
        {
            return a[key] - b[key];
        }
        else
        {
            return b[key] - a[key];
        }
    },

    flow: function (frequency, count, stopAfter)
    {
        if (count === undefined) { count = 1; }

        this.emitting = false;

        this.frequency = frequency;
        this.quantity = count;

        if (stopAfter !== undefined)
        {
            this.stopAfter = stopAfter;
        }

        return this.start();
    },

    explode: function (count, x, y)
    {
        this.frequency = -1;

        this.resetCounters(-1, true);

        var particle = this.emitParticle(count, x, y);

        this.emit(Events.EXPLODE, this, particle);

        return particle;
    },

    emitParticleAt: function (x, y, count)
    {
        return this.emitParticle(count, x, y);
    },

    emitParticle: function (count, x, y)
    {
        if (this.atLimit())
        {
            return;
        }

        if (count === undefined)
        {
            count = this.ops.quantity.onEmit();
        }

        var dead = this.dead;
        var stopAfter = this.stopAfter;

        var followX = (this.follow) ? this.follow.x + this.followOffset.x : x;
        var followY = (this.follow) ? this.follow.y + this.followOffset.y : y;

        for (var i = 0; i < count; i++)
        {
            var particle = dead.pop();

            if (!particle)
            {
                particle = new this.particleClass(this);
            }

            if (particle.fire(followX, followY))
            {
                if (this.particleBringToTop)
                {
                    this.alive.push(particle);
                }
                else
                {
                    this.alive.unshift(particle);
                }

                if (this.emitCallback)
                {
                    this.emitCallback.call(this.emitCallbackScope, particle, this);
                }
            }
            else
            {
                this.dead.push(particle);
            }

            if (stopAfter > 0)
            {
                this.stopCounter++;

                if (this.stopCounter >= stopAfter)
                {
                    break;
                }
            }

            if (this.atLimit())
            {
                break;
            }
        }

        return particle;
    },

    fastForward: function (time, delta)
    {
        if (delta === undefined) { delta = 1000 / 60; }

        var total = 0;

        this.skipping = true;

        while (total < Math.abs(time))
        {
            this.preUpdate(0, delta);

            total += delta;
        }

        this.skipping = false;

        return this;
    },

    preUpdate: function (time, delta)
    {

        delta *= this.timeScale;

        var step = (delta / 1000);

        if (this.trackVisible)
        {
            this.visible = this.follow.visible;
        }

        this.getWorldTransformMatrix(this.worldMatrix);

        var processors = this.getProcessors();

        var particles = this.alive;
        var dead = this.dead;

        var i = 0;
        var rip = [];
        var length = particles.length;

        for (i = 0; i < length; i++)
        {
            var particle = particles[i];

            if (particle.update(delta, step, processors))
            {
                rip.push({ index: i, particle: particle });
            }
        }

        length = rip.length;

        if (length > 0)
        {
            var deathCallback = this.deathCallback;
            var deathCallbackScope = this.deathCallbackScope;

            for (i = length - 1; i >= 0; i--)
            {
                var entry = rip[i];

                particles.splice(entry.index, 1);

                dead.push(entry.particle);

                if (deathCallback)
                {
                    deathCallback.call(deathCallbackScope, entry.particle);
                }

                entry.particle.setPosition();
            }
        }

        if (!this.emitting && !this.skipping)
        {
            if (this.completeFlag === 1 && particles.length === 0)
            {
                this.completeFlag = 0;

                this.emit(Events.COMPLETE, this);
            }

            return;
        }

        if (this.frequency === 0)
        {
            this.emitParticle();
        }
        else if (this.frequency > 0)
        {
            this.flowCounter -= delta;

            while (this.flowCounter <= 0)
            {

                this.emitParticle();

                this.flowCounter += this.frequency;
            }
        }

        if (!this.skipping)
        {
            if (this.duration > 0)
            {

                this.elapsed += delta;

                if (this.elapsed >= this.duration)
                {
                    this.stop();
                }
            }

            if (this.stopAfter > 0 && this.stopCounter >= this.stopAfter)
            {
                this.stop();
            }
        }
    },

    overlap: function (target)
    {
        var matrix = this.getWorldTransformMatrix();

        var alive = this.alive;
        var length = alive.length;

        var output = [];

        for (var i = 0; i < length; i++)
        {
            var particle = alive[i];

            if (RectangleToRectangle(target, particle.getBounds(matrix)))
            {
                output.push(particle);
            }
        }

        return output;
    },

    getBounds: function (padding, advance, delta, output)
    {
        if (padding === undefined) { padding = 0; }
        if (advance === undefined) { advance = 0; }
        if (delta === undefined) { delta = 1000 / 60; }
        if (output === undefined) { output = new Rectangle(); }

        var matrix = this.getWorldTransformMatrix();

        var i;
        var bounds;
        var alive = this.alive;
        var setFirst = false;

        output.setTo(0, 0, 0, 0);

        if (advance > 0)
        {
            var total = 0;

            this.skipping = true;

            while (total < Math.abs(advance))
            {
                this.preUpdate(0, delta);

                for (i = 0; i < alive.length; i++)
                {
                    bounds = alive[i].getBounds(matrix);

                    if (!setFirst)
                    {
                        setFirst = true;

                        CopyFrom(bounds, output);
                    }
                    else
                    {
                        MergeRect(output, bounds);
                    }
                }

                total += delta;
            }

            this.skipping = false;
        }
        else
        {
            for (i = 0; i < alive.length; i++)
            {
                bounds = alive[i].getBounds(matrix);

                if (!setFirst)
                {
                    setFirst = true;

                    CopyFrom(bounds, output);
                }
                else
                {
                    MergeRect(output, bounds);
                }
            }
        }

        if (padding > 0)
        {
            Inflate(output, padding, padding);
        }

        return output;
    },

    createEmitter: function ()
    {
        throw new Error('createEmitter removed. See ParticleEmitter docs for info');
    },

    particleX: {

        get: function ()
        {
            return this.ops.x.current;
        },

        set: function (value)
        {
            this.ops.x.onChange(value);
        }

    },

    particleY: {

        get: function ()
        {
            return this.ops.y.current;
        },

        set: function (value)
        {
            this.ops.y.onChange(value);
        }

    },

    accelerationX: {

        get: function ()
        {
            return this.ops.accelerationX.current;
        },

        set: function (value)
        {
            this.ops.accelerationX.onChange(value);
        }

    },

    accelerationY: {

        get: function ()
        {
            return this.ops.accelerationY.current;
        },

        set: function (value)
        {
            this.ops.accelerationY.onChange(value);
        }

    },

    maxVelocityX: {

        get: function ()
        {
            return this.ops.maxVelocityX.current;
        },

        set: function (value)
        {
            this.ops.maxVelocityX.onChange(value);
        }

    },

    maxVelocityY: {

        get: function ()
        {
            return this.ops.maxVelocityY.current;
        },

        set: function (value)
        {
            this.ops.maxVelocityY.onChange(value);
        }

    },

    speed: {

        get: function ()
        {
            return this.ops.speedX.current;
        },

        set: function (value)
        {
            this.ops.speedX.onChange(value);
            this.ops.speedY.onChange(value);
        }

    },

    speedX: {

        get: function ()
        {
            return this.ops.speedX.current;
        },

        set: function (value)
        {
            this.ops.speedX.onChange(value);
        }

    },

    speedY: {

        get: function ()
        {
            return this.ops.speedY.current;
        },

        set: function (value)
        {
            this.ops.speedY.onChange(value);
        }

    },

    moveToX: {

        get: function ()
        {
            return this.ops.moveToX.current;
        },

        set: function (value)
        {
            this.ops.moveToX.onChange(value);
        }

    },

    moveToY: {

        get: function ()
        {
            return this.ops.moveToY.current;
        },

        set: function (value)
        {
            this.ops.moveToY.onChange(value);
        }

    },

    bounce: {

        get: function ()
        {
            return this.ops.bounce.current;
        },

        set: function (value)
        {
            this.ops.bounce.onChange(value);
        }

    },

    particleScaleX: {

        get: function ()
        {
            return this.ops.scaleX.current;
        },

        set: function (value)
        {
            this.ops.scaleX.onChange(value);
        }

    },

    particleScaleY: {

        get: function ()
        {
            return this.ops.scaleY.current;
        },

        set: function (value)
        {
            this.ops.scaleY.onChange(value);
        }

    },

    particleColor: {

        get: function ()
        {
            return this.ops.color.current;
        },

        set: function (value)
        {
            this.ops.color.onChange(value);
        }

    },

    colorEase: {

        get: function ()
        {
            return this.ops.color.easeName;
        },

        set: function (value)
        {
            this.ops.color.setEase(value);
        }

    },

    particleTint: {

        get: function ()
        {
            return this.ops.tint.current;
        },

        set: function (value)
        {
            this.ops.tint.onChange(value);
        }

    },

    particleAlpha: {

        get: function ()
        {
            return this.ops.alpha.current;
        },

        set: function (value)
        {
            this.ops.alpha.onChange(value);
        }

    },

    lifespan: {

        get: function ()
        {
            return this.ops.lifespan.current;
        },

        set: function (value)
        {
            this.ops.lifespan.onChange(value);
        }

    },

    particleAngle: {

        get: function ()
        {
            return this.ops.angle.current;
        },

        set: function (value)
        {
            this.ops.angle.onChange(value);
        }

    },

    particleRotate: {

        get: function ()
        {
            return this.ops.rotate.current;
        },

        set: function (value)
        {
            this.ops.rotate.onChange(value);
        }

    },

    quantity: {

        get: function ()
        {
            return this.ops.quantity.current;
        },

        set: function (value)
        {
            this.ops.quantity.onChange(value);
        }

    },

    delay: {

        get: function ()
        {
            return this.ops.delay.current;
        },

        set: function (value)
        {
            this.ops.delay.onChange(value);
        }

    },

    hold: {

        get: function ()
        {
            return this.ops.hold.current;
        },

        set: function (value)
        {
            this.ops.hold.onChange(value);
        }

    },

    flowCounter: {

        get: function ()
        {
            return this.counters[0];
        },

        set: function (value)
        {
            this.counters[0] = value;
        }

    },

    frameCounter: {

        get: function ()
        {
            return this.counters[1];
        },

        set: function (value)
        {
            this.counters[1] = value;
        }

    },

    animCounter: {

        get: function ()
        {
            return this.counters[2];
        },

        set: function (value)
        {
            this.counters[2] = value;
        }

    },

    elapsed: {

        get: function ()
        {
            return this.counters[3];
        },

        set: function (value)
        {
            this.counters[3] = value;
        }

    },

    stopCounter: {

        get: function ()
        {
            return this.counters[4];
        },

        set: function (value)
        {
            this.counters[4] = value;
        }

    },

    completeFlag: {

        get: function ()
        {
            return this.counters[5];
        },

        set: function (value)
        {
            this.counters[5] = value;
        }

    },

    zoneIndex: {

        get: function ()
        {
            return this.counters[6];
        },

        set: function (value)
        {
            this.counters[6] = value;
        }

    },

    zoneTotal: {

        get: function ()
        {
            return this.counters[7];
        },

        set: function (value)
        {
            this.counters[7] = value;
        }

    },

    currentFrame: {

        get: function ()
        {
            return this.counters[8];
        },

        set: function (value)
        {
            this.counters[8] = value;
        }

    },

    currentAnim: {

        get: function ()
        {
            return this.counters[9];
        },

        set: function (value)
        {
            this.counters[9] = value;
        }

    },

    preDestroy: function ()
    {
        this.texture = null;
        this.frames = null;
        this.anims = null;
        this.emitCallback = null;
        this.emitCallbackScope = null;
        this.deathCallback = null;
        this.deathCallbackScope = null;
        this.emitZones = null;
        this.deathZones = null;
        this.bounds = null;
        this.follow = null;
        this.counters = null;

        var i;

        var ops = this.ops;

        for (i = 0; i < configOpMap.length; i++)
        {
            var key = configOpMap[i];

            ops[key].destroy();
        }

        for (i = 0; i < this.alive.length; i++)
        {
            this.alive[i].destroy();
        }

        for (i = 0; i < this.dead.length; i++)
        {
            this.dead[i].destroy();
        }

        this.ops = null;
        this.alive = [];
        this.dead = [];
        this.worldMatrix.destroy();
    }

});

module.exports = ParticleEmitter;
