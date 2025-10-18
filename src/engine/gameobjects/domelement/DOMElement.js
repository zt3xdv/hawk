var Class = require('../../utils/Class');
var Components = require('../components');
var DOMElementRender = require('./DOMElementRender');
var GameObject = require('../GameObject');
var IsPlainObject = require('../../utils/object/IsPlainObject');
var RemoveFromDOM = require('../../dom/RemoveFromDOM');
var SCENE_EVENTS = require('../../scene/events');
var Vector4 = require('../../math/Vector4');

var DOMElement = new Class({

    Extends: GameObject,

    Mixins: [
        Components.AlphaSingle,
        Components.BlendMode,
        Components.Depth,
        Components.Origin,
        Components.ScrollFactor,
        Components.Transform,
        Components.Visible,
        DOMElementRender
    ],

    initialize:

    function DOMElement (scene, x, y, element, style, innerText)
    {
        GameObject.call(this, scene, 'DOMElement');

        this.parent = scene.sys.game.domContainer;

        if (!this.parent)
        {
            throw new Error('No DOM Container set in game config');
        }

        this.cache = scene.sys.cache.html;

        this.node;

        this.transformOnly = false;

        this.skewX = 0;

        this.skewY = 0;

        this.rotate3d = new Vector4();

        this.rotate3dAngle = 'deg';

        this.pointerEvents = 'auto';

        this.width = 0;

        this.height = 0;

        this.displayWidth = 0;

        this.displayHeight = 0;

        this.handler = this.dispatchNativeEvent.bind(this);

        this.setPosition(x, y);

        if (typeof element === 'string')
        {

            if (element[0] === '#')
            {
                this.setElement(element.substr(1), style, innerText);
            }
            else
            {
                this.createElement(element, style, innerText);
            }
        }
        else if (element)
        {
            this.setElement(element, style, innerText);
        }

        scene.sys.events.on(SCENE_EVENTS.SLEEP, this.handleSceneEvent, this);
        scene.sys.events.on(SCENE_EVENTS.WAKE, this.handleSceneEvent, this);
        scene.sys.events.on(SCENE_EVENTS.PRE_RENDER, this.preRender, this);
    },

    handleSceneEvent: function (sys)
    {
        var node = this.node;
        var style = node.style;

        if (node)
        {
            style.display = (sys.settings.visible) ? 'block' : 'none';
        }
    },

    setSkew: function (x, y)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = x; }

        this.skewX = x;
        this.skewY = y;

        return this;
    },

    setPerspective: function (value)
    {
        this.parent.style.perspective = value + 'px';

        return this;
    },

    perspective: {

        get: function ()
        {
            return parseFloat(this.parent.style.perspective);
        },

        set: function (value)
        {
            this.parent.style.perspective = value + 'px';
        }

    },

    addListener: function (events)
    {
        if (this.node)
        {
            events = events.split(' ');

            for (var i = 0; i < events.length; i++)
            {
                this.node.addEventListener(events[i], this.handler, false);
            }
        }

        return this;
    },

    removeListener: function (events)
    {
        if (this.node)
        {
            events = events.split(' ');

            for (var i = 0; i < events.length; i++)
            {
                this.node.removeEventListener(events[i], this.handler);
            }
        }

        return this;
    },

    dispatchNativeEvent: function (event)
    {
        this.emit(event.type, event);
    },

    createElement: function (tagName, style, innerText)
    {
        return this.setElement(document.createElement(tagName), style, innerText);
    },

    setElement: function (element, style, innerText)
    {

        this.removeElement();

        var target;

        if (typeof element === 'string')
        {

            if (element[0] === '#')
            {
                element = element.substr(1);
            }

            target = document.getElementById(element);
        }
        else if (typeof element === 'object' && element.nodeType === 1)
        {
            target = element;
        }

        if (!target)
        {
            return this;
        }

        this.node = target;

        if (style && IsPlainObject(style))
        {
            for (var key in style)
            {
                target.style[key] = style[key];
            }
        }
        else if (typeof style === 'string')
        {
            target.style = style;
        }

        target.style.zIndex = '0';
        target.style.display = 'inline';
        target.style.position = 'absolute';

        target.phaser = this;

        this.parent.appendChild(target);

        if (innerText)
        {
            target.innerText = innerText;
        }

        return this.updateSize();
    },

    createFromCache: function (key, tagName)
    {
        var html = this.cache.get(key);

        if (html)
        {
            this.createFromHTML(html, tagName);
        }

        return this;
    },

    createFromHTML: function (html, tagName)
    {
        if (tagName === undefined) { tagName = 'div'; }

        this.removeElement();

        var element = document.createElement(tagName);

        this.node = element;

        element.style.zIndex = '0';
        element.style.display = 'inline';
        element.style.position = 'absolute';

        element.phaser = this;

        this.parent.appendChild(element);

        element.innerHTML = html;

        return this.updateSize();
    },

    removeElement: function ()
    {
        if (this.node)
        {
            RemoveFromDOM(this.node);

            this.node = null;
        }

        return this;
    },

    updateSize: function ()
    {
        var node = this.node;

        this.width = node.clientWidth;
        this.height = node.clientHeight;

        this.displayWidth = this.width * this.scaleX;
        this.displayHeight = this.height * this.scaleY;

        return this;
    },

    getChildByProperty: function (property, value)
    {
        if (this.node)
        {
            var children = this.node.querySelectorAll('*');

            for (var i = 0; i < children.length; i++)
            {
                if (children[i][property] === value)
                {
                    return children[i];
                }
            }
        }

        return null;
    },

    getChildByID: function (id)
    {
        return this.getChildByProperty('id', id);
    },

    getChildByName: function (name)
    {
        return this.getChildByProperty('name', name);
    },

    setClassName: function (className)
    {
        if (this.node)
        {
            this.node.className = className;

            this.updateSize();
        }

        return this;
    },

    setText: function (text)
    {
        if (this.node)
        {
            this.node.innerText = text;

            this.updateSize();
        }

        return this;
    },

    setHTML: function (html)
    {
        if (this.node)
        {
            this.node.innerHTML = html;

            this.updateSize();
        }

        return this;
    },

    preRender: function ()
    {
        var parent = this.parentContainer;
        var node = this.node;

        if (node && parent && !parent.willRender())
        {
            node.style.display = 'none';
        }
    },

    willRender: function ()
    {
        return true;
    },

    preDestroy: function ()
    {
        this.removeElement();

        this.scene.sys.events.off(SCENE_EVENTS.SLEEP, this.handleSceneEvent, this);
        this.scene.sys.events.off(SCENE_EVENTS.WAKE, this.handleSceneEvent, this);
        this.scene.sys.events.off(SCENE_EVENTS.PRE_RENDER, this.preRender, this);
    }

});

module.exports = DOMElement;
