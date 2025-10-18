var BlendModes = require('../../renderer/BlendModes');
var Class = require('../../utils/Class');
var Components = require('../components');
var ComponentsToJSON = require('../components/ToJSON');
var DataManager = require('../../data/DataManager');
var EventEmitter = require('eventemitter3');
var GameObjectEvents = require('../events');
var List = require('../../structs/List');
var Render = require('./LayerRender');
var SceneEvents = require('../../scene/events');
var StableSort = require('../../utils/array/StableSort');

var Layer = new Class({

    Extends: List,

    Mixins: [
        Components.AlphaSingle,
        Components.BlendMode,
        Components.Depth,
        Components.Mask,
        Components.PostPipeline,
        Components.Visible,
        EventEmitter,
        Render
    ],

    initialize:

    function Layer (scene, children)
    {
        List.call(this, scene);
        EventEmitter.call(this);

        this.scene = scene;

        this.displayList = null;

        this.type = 'Layer';

        this.state = 0;

        this.parentContainer = null;

        this.name = '';

        this.active = true;

        this.tabIndex = -1;

        this.data = null;

        this.renderFlags = 15;

        this.cameraFilter = 0;

        this.input = null;

        this.body = null;

        this.ignoreDestroy = false;

        this.systems = scene.sys;

        this.events = scene.sys.events;

        this.sortChildrenFlag = false;

        this.addCallback = this.addChildCallback;
        this.removeCallback = this.removeChildCallback;

        this.initPostPipeline();

        this.clearAlpha();

        this.setBlendMode(BlendModes.SKIP_CHECK);

        if (children)
        {
            this.add(children);
        }

        scene.sys.queueDepthSort();
    },

    setActive: function (value)
    {
        this.active = value;

        return this;
    },

    setName: function (value)
    {
        this.name = value;

        return this;
    },

    setState: function (value)
    {
        this.state = value;

        return this;
    },

    setDataEnabled: function ()
    {
        if (!this.data)
        {
            this.data = new DataManager(this);
        }

        return this;
    },

    setData: function (key, value)
    {
        if (!this.data)
        {
            this.data = new DataManager(this);
        }

        this.data.set(key, value);

        return this;
    },

    incData: function (key, value)
    {
        if (!this.data)
        {
            this.data = new DataManager(this);
        }

        this.data.inc(key, value);

        return this;
    },

    toggleData: function (key)
    {
        if (!this.data)
        {
            this.data = new DataManager(this);
        }

        this.data.toggle(key);

        return this;
    },

    getData: function (key)
    {
        if (!this.data)
        {
            this.data = new DataManager(this);
        }

        return this.data.get(key);
    },

    setInteractive: function ()
    {
        return this;
    },

    disableInteractive: function ()
    {
        return this;
    },

    removeInteractive: function ()
    {
        return this;
    },

    addedToScene: function ()
    {
    },

    removedFromScene: function ()
    {
    },

    update: function ()
    {
    },

    toJSON: function ()
    {
        return ComponentsToJSON(this);
    },

    willRender: function (camera)
    {
        return !(this.renderFlags !== 15 || this.list.length === 0 || (this.cameraFilter !== 0 && (this.cameraFilter & camera.id)));
    },

    getIndexList: function ()
    {

        var child = this;
        var parent = this.parentContainer;

        var indexes = [];

        while (parent)
        {
            indexes.unshift(parent.getIndex(child));

            child = parent;

            if (!parent.parentContainer)
            {
                break;
            }
            else
            {
                parent = parent.parentContainer;
            }
        }

        indexes.unshift(this.displayList.getIndex(child));

        return indexes;
    },

    addChildCallback: function (gameObject)
    {
        var displayList = gameObject.displayList;

        if (displayList && displayList !== this)
        {
            gameObject.removeFromDisplayList();
        }

        if (!gameObject.displayList)
        {
            this.queueDepthSort();

            gameObject.displayList = this;

            gameObject.emit(GameObjectEvents.ADDED_TO_SCENE, gameObject, this.scene);

            this.events.emit(SceneEvents.ADDED_TO_SCENE, gameObject, this.scene);
        }
    },

    removeChildCallback: function (gameObject)
    {
        this.queueDepthSort();

        gameObject.displayList = null;

        gameObject.emit(GameObjectEvents.REMOVED_FROM_SCENE, gameObject, this.scene);

        this.events.emit(SceneEvents.REMOVED_FROM_SCENE, gameObject, this.scene);
    },

    queueDepthSort: function ()
    {
        this.sortChildrenFlag = true;
    },

    depthSort: function ()
    {
        if (this.sortChildrenFlag)
        {
            StableSort(this.list, this.sortByDepth);

            this.sortChildrenFlag = false;
        }
    },

    sortByDepth: function (childA, childB)
    {
        return childA._depth - childB._depth;
    },

    getChildren: function ()
    {
        return this.list;
    },

    addToDisplayList: function (displayList)
    {
        if (displayList === undefined) { displayList = this.scene.sys.displayList; }

        if (this.displayList && this.displayList !== displayList)
        {
            this.removeFromDisplayList();
        }

        if (!displayList.exists(this))
        {
            this.displayList = displayList;

            displayList.add(this, true);

            displayList.queueDepthSort();

            this.emit(GameObjectEvents.ADDED_TO_SCENE, this, this.scene);

            displayList.events.emit(SceneEvents.ADDED_TO_SCENE, this, this.scene);
        }

        return this;
    },

    removeFromDisplayList: function ()
    {
        var displayList = this.displayList || this.scene.sys.displayList;

        if (displayList.exists(this))
        {
            displayList.remove(this, true);

            displayList.queueDepthSort();

            this.displayList = null;

            this.emit(GameObjectEvents.REMOVED_FROM_SCENE, this, this.scene);

            displayList.events.emit(SceneEvents.REMOVED_FROM_SCENE, this, this.scene);
        }

        return this;
    },

    getDisplayList: function ()
    {
        var list = null;

        if (this.parentContainer)
        {
            list = this.parentContainer.list;
        }
        else if (this.displayList)
        {
            list = this.displayList.list;
        }

        return list;
    },

    destroy: function (fromScene)
    {

        if (!this.scene || this.ignoreDestroy)
        {
            return;
        }

        this.emit(GameObjectEvents.DESTROY, this);

        var list = this.list;

        while (list.length)
        {
            list[0].destroy(fromScene);
        }

        this.removeAllListeners();

        this.resetPostPipeline(true);

        if (this.displayList)
        {
            this.displayList.remove(this, true, false);

            this.displayList.queueDepthSort();
        }

        if (this.data)
        {
            this.data.destroy();

            this.data = undefined;
        }

        this.active = false;
        this.visible = false;

        this.list = undefined;
        this.scene = undefined;
        this.displayList = undefined;
        this.systems = undefined;
        this.events = undefined;
    }

});

module.exports = Layer;
