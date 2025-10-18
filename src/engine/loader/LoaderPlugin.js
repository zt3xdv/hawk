

var Class = require('../utils/Class');
var CONST = require('./const');
var CustomSet = require('../structs/Set');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var FileTypesManager = require('./FileTypesManager');
var GetFastValue = require('../utils/object/GetFastValue');
var GetValue = require('../utils/object/GetValue');
var IsPlainObject = require('../utils/object/IsPlainObject');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');
var XHRSettings = require('./XHRSettings');


var LoaderPlugin = new Class({

    Extends: EventEmitter,

    initialize:

    function LoaderPlugin (scene)
    {
        EventEmitter.call(this);

        var gameConfig = scene.sys.game.config;
        var sceneConfig = scene.sys.settings.loader;

        
        this.scene = scene;

        
        this.systems = scene.sys;

        
        this.cacheManager = scene.sys.cache;

        
        this.textureManager = scene.sys.textures;

        
        this.sceneManager = scene.sys.game.scene;

        //  Inject the available filetypes into the Loader
        FileTypesManager.install(this);

        
        this.prefix = '';

        
        this.path = '';

        
        this.baseURL = '';

        this.setBaseURL(GetFastValue(sceneConfig, 'baseURL', gameConfig.loaderBaseURL));

        this.setPath(GetFastValue(sceneConfig, 'path', gameConfig.loaderPath));

        this.setPrefix(GetFastValue(sceneConfig, 'prefix', gameConfig.loaderPrefix));

        
        this.maxParallelDownloads = GetFastValue(sceneConfig, 'maxParallelDownloads', gameConfig.loaderMaxParallelDownloads);

        
        this.xhr = XHRSettings(
            GetFastValue(sceneConfig, 'responseType', gameConfig.loaderResponseType),
            GetFastValue(sceneConfig, 'async', gameConfig.loaderAsync),
            GetFastValue(sceneConfig, 'user', gameConfig.loaderUser),
            GetFastValue(sceneConfig, 'password', gameConfig.loaderPassword),
            GetFastValue(sceneConfig, 'timeout', gameConfig.loaderTimeout),
            GetFastValue(sceneConfig, 'withCredentials', gameConfig.loaderWithCredentials)
        );

        
        this.crossOrigin = GetFastValue(sceneConfig, 'crossOrigin', gameConfig.loaderCrossOrigin);

        
        this.imageLoadType = GetFastValue(sceneConfig, 'imageLoadType', gameConfig.loaderImageLoadType);

        
        this.localSchemes = GetFastValue(sceneConfig, 'localScheme', gameConfig.loaderLocalScheme);

        
        this.totalToLoad = 0;

        
        this.progress = 0;

        
        this.list = new CustomSet();

        
        this.inflight = new CustomSet();

        
        this.queue = new CustomSet();

        
        this._deleteQueue = new CustomSet();

        
        this.totalFailed = 0;

        
        this.totalComplete = 0;

        
        this.state = CONST.LOADER_IDLE;

        
        this.multiKeyIndex = 0;

        
        this.maxRetries = GetFastValue(sceneConfig, 'maxRetries', gameConfig.loaderMaxRetries);

        scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
        scene.sys.events.on(SceneEvents.START, this.pluginStart, this);
    },

    
    boot: function ()
    {
        this.systems.events.once(SceneEvents.DESTROY, this.destroy, this);
    },

    
    pluginStart: function ()
    {
        this.systems.events.once(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    
    setBaseURL: function (url)
    {
        if (url === undefined) { url = ''; }

        if (url !== '' && url.substr(-1) !== '/')
        {
            url = url.concat('/');
        }

        this.baseURL = url;

        return this;
    },

    
    setPath: function (path)
    {
        if (path === undefined) { path = ''; }

        if (path !== '' && path.substr(-1) !== '/')
        {
            path = path.concat('/');
        }

        this.path = path;

        return this;
    },

    
    setPrefix: function (prefix)
    {
        if (prefix === undefined) { prefix = ''; }

        this.prefix = prefix;

        return this;
    },

    
    setCORS: function (crossOrigin)
    {
        this.crossOrigin = crossOrigin;

        return this;
    },

    
    addFile: function (file)
    {
        if (!Array.isArray(file))
        {
            file = [ file ];
        }

        for (var i = 0; i < file.length; i++)
        {
            var item = file[i];

            //  Does the file already exist in the cache or texture manager?
            //  Or will it conflict with a file already in the queue or inflight?
            if (!this.keyExists(item))
            {
                this.list.set(item);

                this.emit(Events.ADD, item.key, item.type, this, item);

                if (this.isLoading())
                {
                    this.totalToLoad++;
                    this.updateProgress();
                }
            }
        }
    },

    
    keyExists: function (file)
    {
        var keyConflict = file.hasCacheConflict();

        if (!keyConflict)
        {
            this.list.iterate(function (item)
            {
                if (item.type === file.type && item.key === file.key)
                {
                    keyConflict = true;

                    return false;
                }

            });
        }

        if (!keyConflict && this.isLoading())
        {
            this.inflight.iterate(function (item)
            {
                if (item.type === file.type && item.key === file.key)
                {
                    keyConflict = true;

                    return false;
                }

            });

            this.queue.iterate(function (item)
            {
                if (item.type === file.type && item.key === file.key)
                {
                    keyConflict = true;

                    return false;
                }

            });
        }

        return keyConflict;
    },

    
    addPack: function (pack, packKey)
    {
        //  if no packKey provided we'll add everything to the queue
        if (typeof(packKey) === 'string')
        {
            var subPack = GetValue(pack, packKey);

            if (subPack)
            {
                pack = { packKey: subPack };
            }
        }

        var total = 0;

        //  Store the loader settings in case this pack replaces them
        var currentBaseURL = this.baseURL;
        var currentPath = this.path;
        var currentPrefix = this.prefix;

        //  Here we go ...
        for (var key in pack)
        {
            if (!Object.prototype.hasOwnProperty.call(pack, key))
            {
                continue;
            }

            var config = pack[key];

            //  Any meta data to process?
            var baseURL = GetFastValue(config, 'baseURL', currentBaseURL);
            var path = GetFastValue(config, 'path', currentPath);
            var prefix = GetFastValue(config, 'prefix', currentPrefix);
            var files = GetFastValue(config, 'files', null);
            var defaultType = GetFastValue(config, 'defaultType', 'void');

            if (Array.isArray(files))
            {
                this.setBaseURL(baseURL);
                this.setPath(path);
                this.setPrefix(prefix);

                for (var i = 0; i < files.length; i++)
                {
                    var file = files[i];
                    var type = (file.hasOwnProperty('type')) ? file.type : defaultType;

                    if (this[type])
                    {
                        this[type](file);
                        total++;
                    }
                }
            }
        }

        //  Reset the loader settings
        this.setBaseURL(currentBaseURL);
        this.setPath(currentPath);
        this.setPrefix(currentPrefix);

        return (total > 0);
    },

    
    removePack: function (packKey, dataKey)
    {
        var animationManager = this.systems.anims;
        var cacheManager = this.cacheManager;
        var textureManager = this.textureManager;

        var cacheMap = {
            animation: 'json',
            aseprite: 'json',
            audio: 'audio',
            audioSprite: 'audio',
            binary: 'binary',
            bitmapFont: 'bitmapFont',
            css: null,
            glsl: 'shader',
            html: 'html',
            json: 'json',
            obj: 'obj',
            plugin: null,
            scenePlugin: null,
            script: null,
            spine: 'json',
            text: 'text',
            tilemapCSV: 'tilemap',
            tilemapImpact: 'tilemap',
            tilemapTiledJSON: 'tilemap',
            video: 'video',
            xml: 'xml'
        };

        var pack;

        if (IsPlainObject(packKey))
        {
            pack = packKey;
        }
        else
        {
            pack = cacheManager.json.get(packKey);

            if (!pack)
            {
                console.warn('Asset Pack not found in JSON cache:', packKey);

                return;
            }
        }

        if (dataKey)
        {
            pack = { _: pack[dataKey] };
        }

        for (var configKey in pack)
        {
            var config = pack[configKey];
            var prefix = GetFastValue(config, 'prefix', '');
            var files = GetFastValue(config, 'files');
            var defaultType = GetFastValue(config, 'defaultType');

            if (Array.isArray(files))
            {
                for (var i = 0; i < files.length; i++)
                {
                    var file = files[i];
                    var type = (file.hasOwnProperty('type')) ? file.type : defaultType;

                    if (!type)
                    {
                        console.warn('No type:', file);

                        continue;
                    }

                    var fileKey = prefix + file.key;

                    if (type === 'animation')
                    {
                        animationManager.remove(fileKey);
                    }

                    if (type === 'aseprite' || type === 'atlas' || type === 'atlasXML' || type === 'htmlTexture' || type === 'image' || type === 'multiatlas' || type === 'spritesheet' || type === 'svg' || type === 'texture' || type === 'unityAtlas')
                    {
                        textureManager.remove(fileKey);

                        if (!cacheMap[type])
                        {
                            continue;
                        }
                    }

                    if (type === 'pack')
                    {
                        this.removePack(fileKey, file.dataKey);

                        continue;
                    }

                    if (type === 'spine')
                    {
                        var spineAtlas = cacheManager.custom.spine.get(fileKey);

                        if (!spineAtlas)
                        {
                            continue;
                        }

                        var spinePrefix = (spineAtlas.prefix === undefined) ? '' : spineAtlas.prefix;

                        cacheManager.custom.spine.remove(fileKey);

                        var spineTexture = cacheManager.custom.spineTextures.get(fileKey);

                        if (!spineTexture)
                        {
                            continue;
                        }

                        cacheManager.custom.spineTextures.remove(fileKey);

                        for (var j = 0; j < spineTexture.pages.length; j++)
                        {
                            var page = spineTexture.pages[j];
                            var textureKey = spinePrefix + page.name;
                            var altTextureKey = fileKey + ':' + textureKey;

                            if (textureManager.exists(altTextureKey))
                            {
                                textureManager.remove(altTextureKey);
                            }
                            else
                            {
                                textureManager.remove(textureKey);
                            }
                        }
                    }

                    var cacheName = cacheMap[type];

                    if (cacheName === null)
                    {
                        //  Nothing to remove.

                        continue;
                    }

                    if (!cacheName)
                    {
                        console.warn('Unknown type:', type);

                        continue;
                    }

                    var cache = cacheManager[cacheName];

                    cache.remove(fileKey);
                }
            }
        }
    },

    
    isLoading: function ()
    {
        return (this.state === CONST.LOADER_LOADING || this.state === CONST.LOADER_PROCESSING);
    },

    
    isReady: function ()
    {
        return (this.state === CONST.LOADER_IDLE || this.state === CONST.LOADER_COMPLETE);
    },

    
    start: function ()
    {
        if (!this.isReady())
        {
            return;
        }

        this.progress = 0;

        this.totalFailed = 0;
        this.totalComplete = 0;
        this.totalToLoad = this.list.size;

        this.emit(Events.START, this);

        if (this.list.size === 0)
        {
            this.loadComplete();
        }
        else
        {
            this.state = CONST.LOADER_LOADING;

            this.inflight.clear();
            this.queue.clear();

            this.updateProgress();

            this.checkLoadQueue();

            this.systems.events.on(SceneEvents.UPDATE, this.update, this);
        }
    },

    
    updateProgress: function ()
    {
        this.progress = 1 - ((this.list.size + this.inflight.size) / this.totalToLoad);

        this.emit(Events.PROGRESS, this.progress);
    },

    
    update: function ()
    {
        if (this.state === CONST.LOADER_LOADING && this.list.size > 0 && this.inflight.size < this.maxParallelDownloads)
        {
            this.checkLoadQueue();
        }
    },

    
    checkLoadQueue: function ()
    {
        this.list.each(function (file)
        {
            if (file.state === CONST.FILE_POPULATED || (file.state === CONST.FILE_PENDING && this.inflight.size < this.maxParallelDownloads))
            {
                this.inflight.set(file);

                this.list.delete(file);

                //  If the file doesn't have its own crossOrigin set, we'll use the Loaders (which is undefined by default)
                if (!file.crossOrigin)
                {
                    file.crossOrigin = this.crossOrigin;
                }

                file.load();
            }

            if (this.inflight.size === this.maxParallelDownloads)
            {
                //  Tells the Set iterator to abort
                return false;
            }

        }, this);
    },

    
    nextFile: function (file, success)
    {
        //  Has the game been destroyed during load? If so, bail out now.
        if (!this.inflight)
        {
            return;
        }

        this.inflight.delete(file);

        this.updateProgress();

        if (success)
        {
            this.totalComplete++;

            this.queue.set(file);

            this.emit(Events.FILE_LOAD, file);

            file.onProcess();
        }
        else
        {
            this.totalFailed++;

            this._deleteQueue.set(file);

            this.emit(Events.FILE_LOAD_ERROR, file);

            this.fileProcessComplete(file);
        }
    },

    
    fileProcessComplete: function (file)
    {
        //  Has the game been destroyed during load? If so, bail out now.
        if (!this.scene || !this.systems || !this.systems.game || this.systems.game.pendingDestroy)
        {
            return;
        }

        //  This file has failed, so move it to the failed Set
        if (file.state === CONST.FILE_ERRORED)
        {
            if (file.multiFile)
            {
                file.multiFile.onFileFailed(file);
            }
        }
        else if (file.state === CONST.FILE_COMPLETE)
        {
            if (file.multiFile)
            {
                if (file.multiFile.isReadyToProcess())
                {
                    //  If we got here then all files the link file needs are ready to add to the cache
                    file.multiFile.addToCache();
                    file.multiFile.pendingDestroy();
                }
            }
            else
            {
                //  If we got here, then the file processed, so let it add itself to its cache
                file.addToCache();
                file.pendingDestroy();
            }
        }

        //  Remove it from the queue
        this.queue.delete(file);

        //  Nothing left to do?

        if (this.list.size === 0 && this.inflight.size === 0 && this.queue.size === 0)
        {
            this.loadComplete();
        }
    },

    
    loadComplete: function ()
    {
        this.emit(Events.POST_PROCESS, this);

        this.list.clear();
        this.inflight.clear();
        this.queue.clear();

        this.progress = 1;

        this.state = CONST.LOADER_COMPLETE;

        this.systems.events.off(SceneEvents.UPDATE, this.update, this);

        //  Call 'destroy' on each file ready for deletion
        this._deleteQueue.iterateLocal('destroy');

        this._deleteQueue.clear();

        this.emit(Events.COMPLETE, this, this.totalComplete, this.totalFailed);
    },

    
    flagForRemoval: function (file)
    {
        this._deleteQueue.set(file);
    },

    
    saveJSON: function (data, filename)
    {
        return this.save(JSON.stringify(data), filename);
    },

    
    save: function (data, filename, filetype)
    {
        if (filename === undefined) { filename = 'file.json'; }
        if (filetype === undefined) { filetype = 'application/json'; }

        var blob = new Blob([ data ], { type: filetype });

        var url = URL.createObjectURL(blob);

        var a = document.createElement('a');

        a.download = filename;
        a.textContent = 'Download ' + filename;
        a.href = url;
        a.click();

        return this;
    },

    
    reset: function ()
    {
        this.list.clear();
        this.inflight.clear();
        this.queue.clear();

        var gameConfig = this.systems.game.config;
        var sceneConfig = this.systems.settings.loader;

        this.setBaseURL(GetFastValue(sceneConfig, 'baseURL', gameConfig.loaderBaseURL));
        this.setPath(GetFastValue(sceneConfig, 'path', gameConfig.loaderPath));
        this.setPrefix(GetFastValue(sceneConfig, 'prefix', gameConfig.loaderPrefix));

        this.state = CONST.LOADER_IDLE;
    },

    
    shutdown: function ()
    {
        this.reset();

        this.state = CONST.LOADER_SHUTDOWN;

        this.removeAllListeners();

        this.systems.events.off(SceneEvents.UPDATE, this.update, this);
        this.systems.events.off(SceneEvents.SHUTDOWN, this.shutdown, this);
    },

    
    destroy: function ()
    {
        this.shutdown();

        this.state = CONST.LOADER_DESTROYED;

        this.systems.events.off(SceneEvents.UPDATE, this.update, this);
        this.systems.events.off(SceneEvents.START, this.pluginStart, this);

        this.list = null;
        this.inflight = null;
        this.queue = null;

        this.scene = null;
        this.systems = null;
        this.textureManager = null;
        this.cacheManager = null;
        this.sceneManager = null;
    }

});

PluginCache.register('Loader', LoaderPlugin, 'load');

module.exports = LoaderPlugin;
