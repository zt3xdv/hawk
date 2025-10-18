var Class = require('../utils/Class');
var CONST = require('./const');
var Events = require('./events');
var GameEvents = require('../core/events');
var GetValue = require('../utils/object/GetValue');
var LoaderEvents = require('../loader/events');
var NOOP = require('../utils/NOOP');
var Scene = require('./Scene');
var Systems = require('./Systems');

var SceneManager = new Class({

    initialize:

    function SceneManager (game, sceneConfig)
    {

        this.game = game;

        this.keys = {};

        this.scenes = [];

        this._pending = [];

        this._start = [];

        this._queue = [];

        this._data = {};

        this.isProcessing = false;

        this.isBooted = false;

        this.customViewports = 0;

        this.systemScene;

        if (sceneConfig)
        {
            if (!Array.isArray(sceneConfig))
            {
                sceneConfig = [ sceneConfig ];
            }

            for (var i = 0; i < sceneConfig.length; i++)
            {

                this._pending.push({
                    key: 'default',
                    scene: sceneConfig[i],
                    autoStart: (i === 0),
                    data: {}
                });
            }
        }

        game.events.once(GameEvents.READY, this.bootQueue, this);
    },

    bootQueue: function ()
    {
        if (this.isBooted)
        {
            return;
        }

        this.systemScene = this.createSceneFromInstance('__SYSTEM', new Scene());

        this.game.events.emit(GameEvents.SYSTEM_READY, this.systemScene, this);

        var i;
        var entry;
        var key;
        var sceneConfig;

        for (i = 0; i < this._pending.length; i++)
        {
            entry = this._pending[i];

            key = entry.key;
            sceneConfig = entry.scene;

            var newScene;

            if (sceneConfig instanceof Scene)
            {
                newScene = this.createSceneFromInstance(key, sceneConfig);
            }
            else if (typeof sceneConfig === 'object')
            {
                newScene = this.createSceneFromObject(key, sceneConfig);
            }
            else if (typeof sceneConfig === 'function')
            {
                newScene = this.createSceneFromFunction(key, sceneConfig);
            }

            key = newScene.sys.settings.key;

            this.keys[key] = newScene;

            this.scenes.push(newScene);

            if (this._data[key])
            {
                newScene.sys.settings.data = this._data[key].data;

                if (this._data[key].autoStart)
                {
                    entry.autoStart = true;
                }
            }

            if (entry.autoStart || newScene.sys.settings.active)
            {
                this._start.push(key);
            }
        }

        this._pending.length = 0;

        this._data = {};

        this.isBooted = true;

        for (i = 0; i < this._start.length; i++)
        {
            entry = this._start[i];

            this.start(entry);
        }

        this._start.length = 0;
    },

    processQueue: function ()
    {
        var pendingLength = this._pending.length;
        var queueLength = this._queue.length;

        if (pendingLength === 0 && queueLength === 0)
        {
            return;
        }

        var i;
        var entry;

        if (pendingLength)
        {
            for (i = 0; i < pendingLength; i++)
            {
                entry = this._pending[i];

                this.add(entry.key, entry.scene, entry.autoStart, entry.data);
            }

            for (i = 0; i < this._start.length; i++)
            {
                entry = this._start[i];

                this.start(entry);
            }

            this._start.length = 0;
            this._pending.length = 0;
        }

        for (i = 0; i < this._queue.length; i++)
        {
            entry = this._queue[i];

            this[entry.op](entry.keyA, entry.keyB, entry.data);
        }

        this._queue.length = 0;
    },

    add: function (key, sceneConfig, autoStart, data)
    {
        if (autoStart === undefined) { autoStart = false; }
        if (data === undefined) { data = {}; }

        if (this.isProcessing || !this.isBooted)
        {
            this._pending.push({
                key: key,
                scene: sceneConfig,
                autoStart: autoStart,
                data: data
            });

            if (!this.isBooted)
            {
                this._data[key] = { data: data };
            }

            return null;
        }

        key = this.getKey(key, sceneConfig);

        var newScene;

        if (sceneConfig instanceof Scene)
        {
            newScene = this.createSceneFromInstance(key, sceneConfig);
        }
        else if (typeof sceneConfig === 'object')
        {
            sceneConfig.key = key;

            newScene = this.createSceneFromObject(key, sceneConfig);
        }
        else if (typeof sceneConfig === 'function')
        {
            newScene = this.createSceneFromFunction(key, sceneConfig);
        }

        newScene.sys.settings.data = data;

        key = newScene.sys.settings.key;

        this.keys[key] = newScene;

        this.scenes.push(newScene);

        if (autoStart || newScene.sys.settings.active)
        {
            if (this._pending.length)
            {
                this._start.push(key);
            }
            else
            {
                this.start(key);
            }
        }

        return newScene;
    },

    remove: function (key)
    {
        if (this.isProcessing)
        {
            return this.queueOp('remove', key);
        }

        var sceneToRemove = this.getScene(key);

        if (!sceneToRemove || sceneToRemove.sys.isTransitioning())
        {
            return this;
        }

        var index = this.scenes.indexOf(sceneToRemove);
        var sceneKey = sceneToRemove.sys.settings.key;

        if (index > -1)
        {
            delete this.keys[sceneKey];
            this.scenes.splice(index, 1);

            if (this._start.indexOf(sceneKey) > -1)
            {
                index = this._start.indexOf(sceneKey);
                this._start.splice(index, 1);
            }

            sceneToRemove.sys.destroy();
        }

        return this;
    },

    bootScene: function (scene)
    {
        var sys = scene.sys;
        var settings = sys.settings;

        sys.sceneUpdate = NOOP;

        if (scene.init)
        {
            scene.init.call(scene, settings.data);

            settings.status = CONST.INIT;

            if (settings.isTransition)
            {
                sys.events.emit(Events.TRANSITION_INIT, settings.transitionFrom, settings.transitionDuration);
            }
        }

        var loader;

        if (sys.load)
        {
            loader = sys.load;

            loader.reset();
        }

        if (loader && scene.preload)
        {
            scene.preload.call(scene);

            settings.status = CONST.LOADING;

            loader.once(LoaderEvents.COMPLETE, this.loadComplete, this);

            loader.start();
        }
        else
        {

            this.create(scene);
        }
    },

    loadComplete: function (loader)
    {
        this.create(loader.scene);
    },

    payloadComplete: function (loader)
    {
        this.bootScene(loader.scene);
    },

    update: function (time, delta)
    {
        this.processQueue();

        this.isProcessing = true;

        for (var i = this.scenes.length - 1; i >= 0; i--)
        {
            var sys = this.scenes[i].sys;

            if (sys.settings.status > CONST.START && sys.settings.status <= CONST.RUNNING)
            {
                sys.step(time, delta);
            }

            if (sys.scenePlugin && sys.scenePlugin._target)
            {
                sys.scenePlugin.step(time, delta);
            }
        }
    },

    render: function (renderer)
    {

        for (var i = 0; i < this.scenes.length; i++)
        {
            var sys = this.scenes[i].sys;

            if (sys.settings.visible && sys.settings.status >= CONST.LOADING && sys.settings.status < CONST.SLEEPING)
            {
                sys.render(renderer);
            }
        }

        this.isProcessing = false;
    },

    create: function (scene)
    {
        var sys = scene.sys;
        var settings = sys.settings;

        if (scene.create)
        {
            settings.status = CONST.CREATING;

            scene.create.call(scene, settings.data);

            if (settings.status === CONST.DESTROYED)
            {
                return;
            }
        }

        if (settings.isTransition)
        {
            sys.events.emit(Events.TRANSITION_START, settings.transitionFrom, settings.transitionDuration);
        }

        if (scene.update)
        {
            sys.sceneUpdate = scene.update;
        }

        settings.status = CONST.RUNNING;

        sys.events.emit(Events.CREATE, scene);
    },

    createSceneFromFunction: function (key, scene)
    {
        var newScene = new scene();

        if (newScene instanceof Scene)
        {
            var configKey = newScene.sys.settings.key;

            if (configKey !== '')
            {
                key = configKey;
            }

            if (this.keys.hasOwnProperty(key))
            {
                throw new Error('Cannot add Scene with duplicate key: ' + key);
            }

            return this.createSceneFromInstance(key, newScene);
        }
        else
        {
            newScene.sys = new Systems(newScene);

            newScene.sys.settings.key = key;

            newScene.sys.init(this.game);

            return newScene;
        }
    },

    createSceneFromInstance: function (key, newScene)
    {
        var configKey = newScene.sys.settings.key;

        if (configKey === '')
        {
            newScene.sys.settings.key = key;
        }

        newScene.sys.init(this.game);

        return newScene;
    },

    createSceneFromObject: function (key, sceneConfig)
    {
        var newScene = new Scene(sceneConfig);

        var configKey = newScene.sys.settings.key;

        if (configKey !== '')
        {
            key = configKey;
        }
        else
        {
            newScene.sys.settings.key = key;
        }

        newScene.sys.init(this.game);

        var defaults = [ 'init', 'preload', 'create', 'update', 'render' ];

        for (var i = 0; i < defaults.length; i++)
        {
            var sceneCallback = GetValue(sceneConfig, defaults[i], null);

            if (sceneCallback)
            {
                newScene[defaults[i]] = sceneCallback;
            }
        }

        if (sceneConfig.hasOwnProperty('extend'))
        {
            for (var propertyKey in sceneConfig.extend)
            {
                if (!sceneConfig.extend.hasOwnProperty(propertyKey))
                {
                    continue;
                }

                var value = sceneConfig.extend[propertyKey];

                if (propertyKey === 'data' && newScene.hasOwnProperty('data') && typeof value === 'object')
                {

                    newScene.data.merge(value);
                }
                else if (propertyKey !== 'sys')
                {
                    newScene[propertyKey] = value;
                }
            }
        }

        return newScene;
    },

    getKey: function (key, sceneConfig)
    {
        if (!key) { key = 'default'; }

        if (typeof sceneConfig === 'function')
        {
            return key;
        }
        else if (sceneConfig instanceof Scene)
        {
            key = sceneConfig.sys.settings.key;
        }
        else if (typeof sceneConfig === 'object' && sceneConfig.hasOwnProperty('key'))
        {
            key = sceneConfig.key;
        }

        if (this.keys.hasOwnProperty(key))
        {
            throw new Error('Cannot add Scene with duplicate key: ' + key);
        }
        else
        {
            return key;
        }
    },

    getScenes: function (isActive, inReverse)
    {
        if (isActive === undefined) { isActive = true; }
        if (inReverse === undefined) { inReverse = false; }

        var out = [];
        var scenes = this.scenes;

        for (var i = 0; i < scenes.length; i++)
        {
            var scene = scenes[i];

            if (scene && (!isActive || (isActive && scene.sys.isActive())))
            {
                out.push(scene);
            }
        }

        return (inReverse) ? out.reverse() : out;
    },

    getScene: function (key)
    {
        if (typeof key === 'string')
        {
            if (this.keys[key])
            {
                return this.keys[key];
            }
        }
        else
        {
            for (var i = 0; i < this.scenes.length; i++)
            {
                if (key === this.scenes[i])
                {
                    return key;
                }
            }
        }

        return null;
    },

    isActive: function (key)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            return scene.sys.isActive();
        }

        return null;
    },

    isPaused: function (key)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            return scene.sys.isPaused();
        }

        return null;
    },

    isVisible: function (key)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            return scene.sys.isVisible();
        }

        return null;
    },

    isSleeping: function (key)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            return scene.sys.isSleeping();
        }

        return null;
    },

    pause: function (key, data)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            scene.sys.pause(data);
        }

        return this;
    },

    resume: function (key, data)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            scene.sys.resume(data);
        }

        return this;
    },

    sleep: function (key, data)
    {
        var scene = this.getScene(key);

        if (scene && !scene.sys.isTransitioning())
        {
            scene.sys.sleep(data);
        }

        return this;
    },

    wake: function (key, data)
    {
        var scene = this.getScene(key);

        if (scene)
        {
            scene.sys.wake(data);
        }

        return this;
    },

    run: function (key, data)
    {
        var scene = this.getScene(key);

        if (!scene)
        {
            for (var i = 0; i < this._pending.length; i++)
            {
                if (this._pending[i].key === key)
                {
                    this.queueOp('start', key, data);
                    break;
                }
            }
            return this;
        }

        if (scene.sys.isSleeping())
        {

            scene.sys.wake(data);
        }
        else if (scene.sys.isPaused())
        {

            scene.sys.resume(data);
        }
        else
        {

            this.start(key, data);
        }
    },

    start: function (key, data)
    {

        if (!this.isBooted)
        {
            this._data[key] = {
                autoStart: true,
                data: data
            };

            return this;
        }

        var scene = this.getScene(key);

        if (!scene)
        {
            console.warn('Scene key not found: ' + key);
            return this;
        }

        var sys = scene.sys;
        var status = sys.settings.status;

        if (status >= CONST.START && status <= CONST.CREATING)
        {
            return this;
        }

        else if (status >= CONST.RUNNING && status <= CONST.SLEEPING)
        {
            sys.shutdown();

            sys.sceneUpdate = NOOP;

            sys.start(data);
        }

        else
        {
            sys.sceneUpdate = NOOP;

            sys.start(data);

            var loader;

            if (sys.load)
            {
                loader = sys.load;
            }

            if (loader && sys.settings.hasOwnProperty('pack'))
            {
                loader.reset();

                if (loader.addPack({ payload: sys.settings.pack }))
                {
                    sys.settings.status = CONST.LOADING;

                    loader.once(LoaderEvents.COMPLETE, this.payloadComplete, this);

                    loader.start();

                    return this;
                }
            }
        }

        this.bootScene(scene);

        return this;
    },

    stop: function (key, data)
    {
        var scene = this.getScene(key);

        if (scene && !scene.sys.isTransitioning() && scene.sys.settings.status !== CONST.SHUTDOWN)
        {
            var loader = scene.sys.load;

            if (loader)
            {
                loader.off(LoaderEvents.COMPLETE, this.loadComplete, this);
                loader.off(LoaderEvents.COMPLETE, this.payloadComplete, this);
            }

            scene.sys.shutdown(data);
        }

        return this;
    },

    switch: function (from, to, data)
    {
        var sceneA = this.getScene(from);
        var sceneB = this.getScene(to);

        if (sceneA && sceneB && sceneA !== sceneB)
        {
            this.sleep(from);

            if (this.isSleeping(to))
            {
                this.wake(to, data);
            }
            else
            {
                this.start(to, data);
            }
        }

        return this;
    },

    getAt: function (index)
    {
        return this.scenes[index];
    },

    getIndex: function (key)
    {
        var scene = this.getScene(key);

        return this.scenes.indexOf(scene);
    },

    bringToTop: function (key)
    {
        if (this.isProcessing)
        {
            return this.queueOp('bringToTop', key);
        }

        var index = this.getIndex(key);
        var scenes = this.scenes;

        if (index !== -1 && index < scenes.length)
        {
            var scene = this.getScene(key);

            scenes.splice(index, 1);
            scenes.push(scene);
        }

        return this;
    },

    sendToBack: function (key)
    {
        if (this.isProcessing)
        {
            return this.queueOp('sendToBack', key);
        }

        var index = this.getIndex(key);

        if (index !== -1 && index > 0)
        {
            var scene = this.getScene(key);

            this.scenes.splice(index, 1);
            this.scenes.unshift(scene);
        }

        return this;
    },

    moveDown: function (key)
    {
        if (this.isProcessing)
        {
            return this.queueOp('moveDown', key);
        }

        var indexA = this.getIndex(key);

        if (indexA > 0)
        {
            var indexB = indexA - 1;
            var sceneA = this.getScene(key);
            var sceneB = this.getAt(indexB);

            this.scenes[indexA] = sceneB;
            this.scenes[indexB] = sceneA;
        }

        return this;
    },

    moveUp: function (key)
    {
        if (this.isProcessing)
        {
            return this.queueOp('moveUp', key);
        }

        var indexA = this.getIndex(key);

        if (indexA < this.scenes.length - 1)
        {
            var indexB = indexA + 1;
            var sceneA = this.getScene(key);
            var sceneB = this.getAt(indexB);

            this.scenes[indexA] = sceneB;
            this.scenes[indexB] = sceneA;
        }

        return this;
    },

    moveAbove: function (keyA, keyB)
    {
        if (keyA === keyB)
        {
            return this;
        }

        if (this.isProcessing)
        {
            return this.queueOp('moveAbove', keyA, keyB);
        }

        var indexA = this.getIndex(keyA);
        var indexB = this.getIndex(keyB);

        if (indexA !== -1 && indexB !== -1 && indexB < indexA)
        {
            var tempScene = this.getAt(indexB);

            this.scenes.splice(indexB, 1);

            this.scenes.splice(indexA + (indexB > indexA), 0, tempScene);
        }

        return this;
    },

    moveBelow: function (keyA, keyB)
    {
        if (keyA === keyB)
        {
            return this;
        }

        if (this.isProcessing)
        {
            return this.queueOp('moveBelow', keyA, keyB);
        }

        var indexA = this.getIndex(keyA);
        var indexB = this.getIndex(keyB);

        if (indexA !== -1 && indexB !== -1 && indexB > indexA)
        {
            var tempScene = this.getAt(indexB);

            this.scenes.splice(indexB, 1);

            if (indexA === 0)
            {
                this.scenes.unshift(tempScene);
            }
            else
            {

                this.scenes.splice(indexA - (indexB < indexA), 0, tempScene);
            }
        }

        return this;
    },

    queueOp: function (op, keyA, keyB, data)
    {
        this._queue.push({ op: op, keyA: keyA, keyB: keyB, data: data });

        return this;
    },

    swapPosition: function (keyA, keyB)
    {
        if (keyA === keyB)
        {
            return this;
        }

        if (this.isProcessing)
        {
            return this.queueOp('swapPosition', keyA, keyB);
        }

        var indexA = this.getIndex(keyA);
        var indexB = this.getIndex(keyB);

        if (indexA !== indexB && indexA !== -1 && indexB !== -1)
        {
            var tempScene = this.getAt(indexA);

            this.scenes[indexA] = this.scenes[indexB];
            this.scenes[indexB] = tempScene;
        }

        return this;
    },

    dump: function ()
    {
        var out = [];
        var map = [ 'pending', 'init', 'start', 'loading', 'creating', 'running', 'paused', 'sleeping', 'shutdown', 'destroyed' ];

        for (var i = 0; i < this.scenes.length; i++)
        {
            var sys = this.scenes[i].sys;

            var key = (sys.settings.visible && (sys.settings.status === CONST.RUNNING || sys.settings.status === CONST.PAUSED)) ? '[*] ' : '[-] ';
            key += sys.settings.key + ' (' + map[sys.settings.status] + ')';

            out.push(key);
        }

        console.log(out.join('\n'));
    },

    destroy: function ()
    {
        for (var i = 0; i < this.scenes.length; i++)
        {
            var sys = this.scenes[i].sys;

            sys.destroy();
        }

        this.systemScene.sys.destroy();

        this.update = NOOP;

        this.scenes = [];

        this._pending = [];
        this._start = [];
        this._queue = [];

        this.game = null;
        this.systemScene = null;
    }

});

module.exports = SceneManager;
