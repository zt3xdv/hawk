var ArrayUtils = require('../../utils/array');
var BlendModes = require('../../renderer/BlendModes');
var Class = require('../../utils/Class');
var Components = require('../components');
var Events = require('../events');
var GameObject = require('../GameObject');
var Rectangle = require('../../geom/rectangle/Rectangle');
var Render = require('./ContainerRender');
var Union = require('../../geom/rectangle/Union');
var Vector2 = require('../../math/Vector2');

var tempTransformMatrix = new Components.TransformMatrix();

var Container = new Class({

    Extends: GameObject,

    Mixins: [
        Components.AlphaSingle,
        Components.BlendMode,
        Components.ComputedSize,
        Components.Depth,
        Components.Mask,
        Components.PostPipeline,
        Components.Transform,
        Components.Visible,
        Render
    ],

    initialize:

    function Container (scene, x, y, children)
    {
        GameObject.call(this, scene, 'Container');

        this.list = [];

        this.exclusive = true;

        this.maxSize = -1;

        this.position = 0;

        this.localTransform = new Components.TransformMatrix();

        this._sortKey = '';

        this._sysEvents = scene.sys.events;

        this.scrollFactorX = 1;

        this.scrollFactorY = 1;

        this.initPostPipeline();

        this.setPosition(x, y);

        this.setBlendMode(BlendModes.SKIP_CHECK);

        if (children)
        {
            this.add(children);
        }
    },

    originX: {

        get: function ()
        {
            return 0.5;
        }

    },

    originY: {

        get: function ()
        {
            return 0.5;
        }

    },

    displayOriginX: {

        get: function ()
        {
            return this.width * 0.5;
        }

    },

    displayOriginY: {

        get: function ()
        {
            return this.height * 0.5;
        }

    },

    setExclusive: function (value)
    {
        if (value === undefined) { value = true; }

        this.exclusive = value;

        return this;
    },

    getBounds: function (output)
    {
        if (output === undefined) { output = new Rectangle(); }

        output.setTo(this.x, this.y, 0, 0);

        if (this.parentContainer)
        {
            var parentMatrix = this.parentContainer.getBoundsTransformMatrix();
            var transformedPosition = parentMatrix.transformPoint(this.x, this.y);

            output.setTo(transformedPosition.x, transformedPosition.y, 0, 0);
        }

        if (this.list.length > 0)
        {
            var children = this.list;
            var tempRect = new Rectangle();
            var hasSetFirst = false;

            output.setEmpty();

            for (var i = 0; i < children.length; i++)
            {
                var entry = children[i];

                if (entry.getBounds)
                {
                    entry.getBounds(tempRect);

                    if (!hasSetFirst)
                    {
                        output.setTo(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
                        hasSetFirst = true;
                    }
                    else
                    {
                        Union(tempRect, output, output);
                    }
                }
            }
        }

        return output;
    },

    addHandler: function (gameObject)
    {
        gameObject.once(Events.DESTROY, this.onChildDestroyed, this);

        if (this.exclusive)
        {
            if (gameObject.parentContainer)
            {
                gameObject.parentContainer.remove(gameObject);
            }

            gameObject.parentContainer = this;

            gameObject.removeFromDisplayList();

            gameObject.addedToScene();
        }
    },

    removeHandler: function (gameObject)
    {
        gameObject.off(Events.DESTROY, this.remove, this);

        if (this.exclusive)
        {
            gameObject.parentContainer = null;

            gameObject.removedFromScene();

            gameObject.addToDisplayList();
        }
    },

    pointToContainer: function (source, output)
    {
        if (output === undefined) { output = new Vector2(); }

        if (this.parentContainer)
        {
            this.parentContainer.pointToContainer(source, output);
        }
        else
        {
            output.x = source.x;
            output.y = source.y;
        }

        var tempMatrix = tempTransformMatrix;

        tempMatrix.applyITRS(this.x, this.y, this.rotation, this.scaleX, this.scaleY);

        tempMatrix.invert();

        tempMatrix.transformPoint(source.x, source.y, output);

        return output;
    },

    getBoundsTransformMatrix: function ()
    {
        return this.getWorldTransformMatrix(tempTransformMatrix, this.localTransform);
    },

    add: function (child)
    {
        ArrayUtils.Add(this.list, child, this.maxSize, this.addHandler, this);

        return this;
    },

    addAt: function (child, index)
    {
        ArrayUtils.AddAt(this.list, child, index, this.maxSize, this.addHandler, this);

        return this;
    },

    getAt: function (index)
    {
        return this.list[index];
    },

    getIndex: function (child)
    {
        return this.list.indexOf(child);
    },

    sort: function (property, handler)
    {
        if (!property)
        {
            return this;
        }

        if (handler === undefined)
        {
            handler = function (childA, childB)
            {
                return childA[property] - childB[property];
            };
        }

        ArrayUtils.StableSort(this.list, handler);

        return this;
    },

    getByName: function (name)
    {
        return ArrayUtils.GetFirst(this.list, 'name', name);
    },

    getRandom: function (startIndex, length)
    {
        return ArrayUtils.GetRandom(this.list, startIndex, length);
    },

    getFirst: function (property, value, startIndex, endIndex)
    {
        return ArrayUtils.GetFirst(this.list, property, value, startIndex, endIndex);
    },

    getAll: function (property, value, startIndex, endIndex)
    {
        return ArrayUtils.GetAll(this.list, property, value, startIndex, endIndex);
    },

    count: function (property, value, startIndex, endIndex)
    {
        return ArrayUtils.CountAllMatching(this.list, property, value, startIndex, endIndex);
    },

    swap: function (child1, child2)
    {
        ArrayUtils.Swap(this.list, child1, child2);

        return this;
    },

    moveTo: function (child, index)
    {
        ArrayUtils.MoveTo(this.list, child, index);

        return this;
    },

    moveAbove: function (child1, child2)
    {
        ArrayUtils.MoveAbove(this.list, child1, child2);

        return this;
    },

    moveBelow: function (child1, child2)
    {
        ArrayUtils.MoveBelow(this.list, child1, child2);

        return this;
    },

    remove: function (child, destroyChild)
    {
        var removed = ArrayUtils.Remove(this.list, child, this.removeHandler, this);

        if (destroyChild && removed)
        {
            if (!Array.isArray(removed))
            {
                removed = [ removed ];
            }

            for (var i = 0; i < removed.length; i++)
            {
                removed[i].destroy();
            }
        }

        return this;
    },

    removeAt: function (index, destroyChild)
    {
        var removed = ArrayUtils.RemoveAt(this.list, index, this.removeHandler, this);

        if (destroyChild && removed)
        {
            removed.destroy();
        }

        return this;
    },

    removeBetween: function (startIndex, endIndex, destroyChild)
    {
        var removed = ArrayUtils.RemoveBetween(this.list, startIndex, endIndex, this.removeHandler, this);

        if (destroyChild)
        {
            for (var i = 0; i < removed.length; i++)
            {
                removed[i].destroy();
            }
        }

        return this;
    },

    removeAll: function (destroyChild)
    {
        var list = this.list;

        if (destroyChild)
        {
            for (var i = 0; i < list.length; i++)
            {
                if (list[i] && list[i].scene)
                {
                    list[i].off(Events.DESTROY, this.onChildDestroyed, this);

                    list[i].destroy();
                }
            }

            this.list = [];
        }
        else
        {
            ArrayUtils.RemoveBetween(list, 0, list.length, this.removeHandler, this);
        }

        return this;
    },

    bringToTop: function (child)
    {
        ArrayUtils.BringToTop(this.list, child);

        return this;
    },

    sendToBack: function (child)
    {
        ArrayUtils.SendToBack(this.list, child);

        return this;
    },

    moveUp: function (child)
    {
        ArrayUtils.MoveUp(this.list, child);

        return this;
    },

    moveDown: function (child)
    {
        ArrayUtils.MoveDown(this.list, child);

        return this;
    },

    reverse: function ()
    {
        this.list.reverse();

        return this;
    },

    shuffle: function ()
    {
        ArrayUtils.Shuffle(this.list);

        return this;
    },

    replace: function (oldChild, newChild, destroyChild)
    {
        var moved = ArrayUtils.Replace(this.list, oldChild, newChild);

        if (moved)
        {
            this.addHandler(newChild);
            this.removeHandler(oldChild);

            if (destroyChild)
            {
                oldChild.destroy();
            }
        }

        return this;
    },

    exists: function (child)
    {
        return (this.list.indexOf(child) > -1);
    },

    setAll: function (property, value, startIndex, endIndex)
    {
        ArrayUtils.SetAll(this.list, property, value, startIndex, endIndex);

        return this;
    },

    each: function (callback, context)
    {
        var args = [ null ];
        var i;
        var temp = this.list.slice();
        var len = temp.length;

        for (i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }

        for (i = 0; i < len; i++)
        {
            args[0] = temp[i];

            callback.apply(context, args);
        }

        return this;
    },

    iterate: function (callback, context)
    {
        var args = [ null ];
        var i;

        for (i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }

        for (i = 0; i < this.list.length; i++)
        {
            args[0] = this.list[i];

            callback.apply(context, args);
        }

        return this;
    },

    setScrollFactor: function (x, y, updateChildren)
    {
        if (y === undefined) { y = x; }
        if (updateChildren === undefined) { updateChildren = false; }

        this.scrollFactorX = x;
        this.scrollFactorY = y;

        if (updateChildren)
        {
            ArrayUtils.SetAll(this.list, 'scrollFactorX', x);
            ArrayUtils.SetAll(this.list, 'scrollFactorY', y);
        }

        return this;
    },

    length: {

        get: function ()
        {
            return this.list.length;
        }

    },

    first: {

        get: function ()
        {
            this.position = 0;

            if (this.list.length > 0)
            {
                return this.list[0];
            }
            else
            {
                return null;
            }
        }

    },

    last: {

        get: function ()
        {
            if (this.list.length > 0)
            {
                this.position = this.list.length - 1;

                return this.list[this.position];
            }
            else
            {
                return null;
            }
        }

    },

    next: {

        get: function ()
        {
            if (this.position < this.list.length)
            {
                this.position++;

                return this.list[this.position];
            }
            else
            {
                return null;
            }
        }

    },

    previous: {

        get: function ()
        {
            if (this.position > 0)
            {
                this.position--;

                return this.list[this.position];
            }
            else
            {
                return null;
            }
        }

    },

    preDestroy: function ()
    {
        this.removeAll(!!this.exclusive);

        this.localTransform.destroy();

        this.list = [];
    },

    onChildDestroyed: function (gameObject)
    {
        ArrayUtils.Remove(this.list, gameObject);

        if (this.exclusive)
        {
            gameObject.parentContainer = null;

            gameObject.removedFromScene();
        }
    }

});

module.exports = Container;
