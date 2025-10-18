var Class = require('../../utils/Class');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var GameEvents = require('../../core/events');
var GetValue = require('../../utils/object/GetValue');
var InputEvents = require('../events');
var InputPluginCache = require('../InputPluginCache');
var Key = require('./keys/Key');
var KeyCodes = require('./keys/KeyCodes');
var KeyCombo = require('./combo/KeyCombo');
var KeyMap = require('./keys/KeyMap');
var SceneEvents = require('../../scene/events');
var SnapFloor = require('../../math/snap/SnapFloor');

var KeyboardPlugin = new Class({

    Extends: EventEmitter,

    initialize:

    function KeyboardPlugin (sceneInputPlugin)
    {
        EventEmitter.call(this);

        this.game = sceneInputPlugin.systems.game;

        this.scene = sceneInputPlugin.scene;

        this.settings = this.scene.sys.settings;

        this.sceneInputPlugin = sceneInputPlugin;

        this.manager = sceneInputPlugin.manager.keyboard;

        this.enabled = true;

        this.keys = [];

        this.combos = [];

        this.prevCode = null;

        this.prevTime = 0;

        this.prevType = null;

        sceneInputPlugin.pluginEvents.once(InputEvents.BOOT, this.boot, this);
        sceneInputPlugin.pluginEvents.on(InputEvents.START, this.start, this);
    },

    boot: function ()
    {
        var settings = this.settings.input;

        this.enabled = GetValue(settings, 'keyboard', true);

        var captures = GetValue(settings, 'keyboard.capture', null);

        if (captures)
        {
            this.addCaptures(captures);
        }

        this.sceneInputPlugin.pluginEvents.once(InputEvents.DESTROY, this.destroy, this);
    },

    start: function ()
    {
        this.sceneInputPlugin.manager.events.on(InputEvents.MANAGER_PROCESS, this.update, this);

        this.sceneInputPlugin.pluginEvents.once(InputEvents.SHUTDOWN, this.shutdown, this);

        this.game.events.on(GameEvents.BLUR, this.resetKeys, this);

        this.scene.sys.events.on(SceneEvents.PAUSE, this.resetKeys, this);
        this.scene.sys.events.on(SceneEvents.SLEEP, this.resetKeys, this);
    },

    isActive: function ()
    {
        return (this.enabled && this.scene.sys.canInput());
    },

    addCapture: function (keycode)
    {
        this.manager.addCapture(keycode);

        return this;
    },

    removeCapture: function (keycode)
    {
        this.manager.removeCapture(keycode);

        return this;
    },

    getCaptures: function ()
    {
        return this.manager.captures;
    },

    enableGlobalCapture: function ()
    {
        this.manager.preventDefault = true;

        return this;
    },

    disableGlobalCapture: function ()
    {
        this.manager.preventDefault = false;

        return this;
    },

    clearCaptures: function ()
    {
        this.manager.clearCaptures();

        return this;
    },

    createCursorKeys: function ()
    {
        return this.addKeys({
            up: KeyCodes.UP,
            down: KeyCodes.DOWN,
            left: KeyCodes.LEFT,
            right: KeyCodes.RIGHT,
            space: KeyCodes.SPACE,
            shift: KeyCodes.SHIFT
        });
    },

    addKeys: function (keys, enableCapture, emitOnRepeat)
    {
        if (enableCapture === undefined) { enableCapture = true; }
        if (emitOnRepeat === undefined) { emitOnRepeat = false; }

        var output = {};

        if (typeof keys === 'string')
        {
            keys = keys.split(',');

            for (var i = 0; i < keys.length; i++)
            {
                var currentKey = keys[i].trim();

                if (currentKey)
                {
                    output[currentKey] = this.addKey(currentKey, enableCapture, emitOnRepeat);
                }
            }
        }
        else
        {
            for (var key in keys)
            {
                output[key] = this.addKey(keys[key], enableCapture, emitOnRepeat);
            }
        }

        return output;
    },

    addKey: function (key, enableCapture, emitOnRepeat)
    {
        if (enableCapture === undefined) { enableCapture = true; }
        if (emitOnRepeat === undefined) { emitOnRepeat = false; }

        var keys = this.keys;

        if (key instanceof Key)
        {
            var idx = keys.indexOf(key);

            if (idx > -1)
            {
                keys[idx] = key;
            }
            else
            {
                keys[key.keyCode] = key;
            }

            if (enableCapture)
            {
                this.addCapture(key.keyCode);
            }

            key.setEmitOnRepeat(emitOnRepeat);

            return key;
        }

        if (typeof key === 'string')
        {
            key = KeyCodes[key.toUpperCase()];
        }

        if (!keys[key])
        {
            keys[key] = new Key(this, key);

            if (enableCapture)
            {
                this.addCapture(key);
            }

            keys[key].setEmitOnRepeat(emitOnRepeat);
        }

        return keys[key];
    },

    removeKey: function (key, destroy, removeCapture)
    {
        if (destroy === undefined) { destroy = false; }
        if (removeCapture === undefined) { removeCapture = false; }

        var keys = this.keys;
        var ref;

        if (key instanceof Key)
        {
            var idx = keys.indexOf(key);

            if (idx > -1)
            {
                ref = this.keys[idx];

                this.keys[idx] = undefined;
            }
        }
        else if (typeof key === 'string')
        {
            key = KeyCodes[key.toUpperCase()];
        }

        if (keys[key])
        {
            ref = keys[key];

            keys[key] = undefined;
        }

        if (ref)
        {
            ref.plugin = null;

            if (removeCapture)
            {
                this.removeCapture(ref.keyCode);
            }

            if (destroy)
            {
                ref.destroy();
            }
        }

        return this;
    },

    removeAllKeys: function (destroy, removeCapture)
    {
        if (destroy === undefined) { destroy = false; }
        if (removeCapture === undefined) { removeCapture = false; }

        var keys = this.keys;

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];

            if (key)
            {
                keys[i] = undefined;

                if (removeCapture)
                {
                    this.removeCapture(key.keyCode);
                }

                if (destroy)
                {
                    key.destroy();
                }
            }
        }

        return this;
    },

    createCombo: function (keys, config)
    {
        return new KeyCombo(this, keys, config);
    },

    checkDown: function (key, duration)
    {
        if (duration === undefined) { duration = 0; }

        if (this.enabled && key.isDown)
        {
            var t = SnapFloor(this.time - key.timeDown, duration);

            if (t > key._tick)
            {
                key._tick = t;

                return true;
            }
        }

        return false;
    },

    update: function ()
    {
        var queue = this.manager.queue;
        var len = queue.length;

        if (!this.isActive() || len === 0)
        {
            return;
        }

        var keys = this.keys;

        for (var i = 0; i < len; i++)
        {
            var event = queue[i];
            var code = event.keyCode;
            var key = keys[code];
            var repeat = false;

            if (event.cancelled === undefined)
            {

                event.cancelled = 0;

                event.stopImmediatePropagation = function ()
                {
                    event.cancelled = 1;
                };

                event.stopPropagation = function ()
                {
                    event.cancelled = -1;
                };
            }

            if (event.cancelled === -1)
            {

                continue;
            }

            if (code === this.prevCode && event.timeStamp === this.prevTime && event.type === this.prevType)
            {

                continue;
            }

            this.prevCode = code;
            this.prevTime = event.timeStamp;
            this.prevType = event.type;

            if (event.type === 'keydown')
            {

                if (key)
                {
                    repeat = key.isDown;

                    key.onDown(event);
                }

                if (!event.cancelled && (!key || !repeat))
                {
                    if (KeyMap[code])
                    {
                        this.emit(Events.KEY_DOWN + KeyMap[code], event);
                    }

                    if (!event.cancelled)
                    {
                        this.emit(Events.ANY_KEY_DOWN, event);
                    }
                }
            }
            else
            {

                if (key)
                {
                    key.onUp(event);
                }

                if (!event.cancelled)
                {
                    if (KeyMap[code])
                    {
                        this.emit(Events.KEY_UP + KeyMap[code], event);
                    }

                    if (!event.cancelled)
                    {
                        this.emit(Events.ANY_KEY_UP, event);
                    }
                }
            }

            if (event.cancelled === 1)
            {
                event.cancelled = 0;
            }
        }
    },

    resetKeys: function ()
    {
        var keys = this.keys;

        for (var i = 0; i < keys.length; i++)
        {

            if (keys[i])
            {
                keys[i].reset();
            }
        }

        return this;
    },

    shutdown: function ()
    {
        this.removeAllKeys(true);
        this.removeAllListeners();

        this.sceneInputPlugin.manager.events.off(InputEvents.MANAGER_PROCESS, this.update, this);

        this.game.events.off(GameEvents.BLUR, this.resetKeys);

        this.scene.sys.events.off(SceneEvents.PAUSE, this.resetKeys, this);
        this.scene.sys.events.off(SceneEvents.SLEEP, this.resetKeys, this);

        this.queue = [];
    },

    destroy: function ()
    {
        this.shutdown();

        var keys = this.keys;

        for (var i = 0; i < keys.length; i++)
        {

            if (keys[i])
            {
                keys[i].destroy();
            }
        }

        this.keys = [];
        this.combos = [];
        this.queue = [];

        this.scene = null;
        this.settings = null;
        this.sceneInputPlugin = null;
        this.manager = null;
    },

    time: {

        get: function ()
        {
            return this.sceneInputPlugin.manager.time;
        }

    }

});

InputPluginCache.register('KeyboardPlugin', KeyboardPlugin, 'keyboard', 'keyboard', 'inputKeyboard');

module.exports = KeyboardPlugin;
