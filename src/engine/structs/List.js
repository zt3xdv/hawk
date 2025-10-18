var ArrayUtils = require('../utils/array');
var Class = require('../utils/Class');
var NOOP = require('../utils/NOOP');
var StableSort = require('../utils/array/StableSort');

var List = new Class({

    initialize:

    function List (parent)
    {

        this.parent = parent;

        this.list = [];

        this.position = 0;

        this.addCallback = NOOP;

        this.removeCallback = NOOP;

        this._sortKey = '';
    },

    add: function (child, skipCallback)
    {
        if (skipCallback)
        {
            return ArrayUtils.Add(this.list, child);
        }
        else
        {
            return ArrayUtils.Add(this.list, child, 0, this.addCallback, this);
        }
    },

    addAt: function (child, index, skipCallback)
    {
        if (skipCallback)
        {
            return ArrayUtils.AddAt(this.list, child, index);
        }
        else
        {
            return ArrayUtils.AddAt(this.list, child, index, 0, this.addCallback, this);
        }
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

        StableSort(this.list, handler);

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

    count: function (property, value)
    {
        return ArrayUtils.CountAllMatching(this.list, property, value);
    },

    swap: function (child1, child2)
    {
        ArrayUtils.Swap(this.list, child1, child2);
    },

    moveTo: function (child, index)
    {
        return ArrayUtils.MoveTo(this.list, child, index);
    },

    moveAbove: function (child1, child2)
    {
        return ArrayUtils.MoveAbove(this.list, child1, child2);
    },

    moveBelow: function (child1, child2)
    {
        return ArrayUtils.MoveBelow(this.list, child1, child2);
    },

    remove: function (child, skipCallback)
    {
        if (skipCallback)
        {
            return ArrayUtils.Remove(this.list, child);
        }
        else
        {
            return ArrayUtils.Remove(this.list, child, this.removeCallback, this);
        }
    },

    removeAt: function (index, skipCallback)
    {
        if (skipCallback)
        {
            return ArrayUtils.RemoveAt(this.list, index);
        }
        else
        {
            return ArrayUtils.RemoveAt(this.list, index, this.removeCallback, this);
        }
    },

    removeBetween: function (startIndex, endIndex, skipCallback)
    {
        if (skipCallback)
        {
            return ArrayUtils.RemoveBetween(this.list, startIndex, endIndex);
        }
        else
        {
            return ArrayUtils.RemoveBetween(this.list, startIndex, endIndex, this.removeCallback, this);
        }
    },

    removeAll: function (skipCallback)
    {
        var i = this.list.length;

        while (i--)
        {
            this.remove(this.list[i], skipCallback);
        }

        return this;
    },

    bringToTop: function (child)
    {
        return ArrayUtils.BringToTop(this.list, child);
    },

    sendToBack: function (child)
    {
        return ArrayUtils.SendToBack(this.list, child);
    },

    moveUp: function (child)
    {
        ArrayUtils.MoveUp(this.list, child);

        return child;
    },

    moveDown: function (child)
    {
        ArrayUtils.MoveDown(this.list, child);

        return child;
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

    replace: function (oldChild, newChild)
    {
        return ArrayUtils.Replace(this.list, oldChild, newChild);
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

        for (var i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }

        for (i = 0; i < this.list.length; i++)
        {
            args[0] = this.list[i];

            callback.apply(context, args);
        }
    },

    shutdown: function ()
    {
        this.removeAll();

        this.list = [];
    },

    destroy: function ()
    {
        this.removeAll();

        this.parent = null;
        this.addCallback = null;
        this.removeCallback = null;
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

    }

});

module.exports = List;
