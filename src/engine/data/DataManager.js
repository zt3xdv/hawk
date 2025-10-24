var Class = require('../utils/Class');
var Events = require('./events');
var DataManager = new Class({
  initialize: function DataManager(parent, eventEmitter) {
    this.parent = parent;
    this.events = eventEmitter;
    if (!eventEmitter) {
      this.events = parent.events ? parent.events : parent;
    }
    this.list = {};
    this.values = {};
    this._frozen = false;
    if (!parent.hasOwnProperty('sys') && this.events) {
      this.events.once(Events.DESTROY, this.destroy, this);
    }
  },
  get: function (key) {
    var list = this.list;
    if (Array.isArray(key)) {
      var output = [];
      for (var i = 0; i < key.length; i++) {
        output.push(list[key[i]]);
      }
      return output;
    } else {
      return list[key];
    }
  },
  getAll: function () {
    var results = {};
    for (var key in this.list) {
      if (this.list.hasOwnProperty(key)) {
        results[key] = this.list[key];
      }
    }
    return results;
  },
  query: function (search) {
    var results = {};
    for (var key in this.list) {
      if (this.list.hasOwnProperty(key) && key.match(search)) {
        results[key] = this.list[key];
      }
    }
    return results;
  },
  set: function (key, data) {
    if (this._frozen) {
      return this;
    }
    if (typeof key === 'string') {
      return this.setValue(key, data);
    } else {
      for (var entry in key) {
        this.setValue(entry, key[entry]);
      }
    }
    return this;
  },
  inc: function (key, amount) {
    if (this._frozen) {
      return this;
    }
    if (amount === undefined) {
      amount = 1;
    }
    var value = this.get(key);
    if (value === undefined) {
      value = 0;
    }
    this.set(key, value + amount);
    return this;
  },
  toggle: function (key) {
    if (this._frozen) {
      return this;
    }
    this.set(key, !this.get(key));
    return this;
  },
  setValue: function (key, data) {
    if (this._frozen) {
      return this;
    }
    if (this.has(key)) {
      this.values[key] = data;
    } else {
      var _this = this;
      var list = this.list;
      var events = this.events;
      var parent = this.parent;
      Object.defineProperty(this.values, key, {
        enumerable: true,
        configurable: true,
        get: function () {
          return list[key];
        },
        set: function (value) {
          if (!_this._frozen) {
            var previousValue = list[key];
            list[key] = value;
            events.emit(Events.CHANGE_DATA, parent, key, value, previousValue);
            events.emit(
              Events.CHANGE_DATA_KEY + key,
              parent,
              value,
              previousValue,
            );
          }
        },
      });
      list[key] = data;
      events.emit(Events.SET_DATA, parent, key, data);
    }
    return this;
  },
  each: function (callback, context) {
    var args = [this.parent, null, undefined];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    for (var key in this.list) {
      args[1] = key;
      args[2] = this.list[key];
      callback.apply(context, args);
    }
    return this;
  },
  merge: function (data, overwrite) {
    if (overwrite === undefined) {
      overwrite = true;
    }
    for (var key in data) {
      if (
        data.hasOwnProperty(key) &&
        (overwrite || (!overwrite && !this.has(key)))
      ) {
        this.setValue(key, data[key]);
      }
    }
    return this;
  },
  remove: function (key) {
    if (this._frozen) {
      return this;
    }
    if (Array.isArray(key)) {
      for (var i = 0; i < key.length; i++) {
        this.removeValue(key[i]);
      }
    } else {
      return this.removeValue(key);
    }
    return this;
  },
  removeValue: function (key) {
    if (this.has(key)) {
      var data = this.list[key];
      delete this.list[key];
      delete this.values[key];
      this.events.emit(Events.REMOVE_DATA, this.parent, key, data);
    }
    return this;
  },
  pop: function (key) {
    var data = undefined;
    if (!this._frozen && this.has(key)) {
      data = this.list[key];
      delete this.list[key];
      delete this.values[key];
      this.events.emit(Events.REMOVE_DATA, this.parent, key, data);
    }
    return data;
  },
  has: function (key) {
    return this.list.hasOwnProperty(key);
  },
  setFreeze: function (value) {
    this._frozen = value;
    return this;
  },
  reset: function () {
    for (var key in this.list) {
      delete this.list[key];
      delete this.values[key];
    }
    this._frozen = false;
    return this;
  },
  destroy: function () {
    this.reset();
    this.events.off(Events.CHANGE_DATA);
    this.events.off(Events.SET_DATA);
    this.events.off(Events.REMOVE_DATA);
    this.parent = null;
  },
  freeze: {
    get: function () {
      return this._frozen;
    },
    set: function (value) {
      this._frozen = value ? true : false;
    },
  },
  count: {
    get: function () {
      var i = 0;
      for (var key in this.list) {
        if (this.list[key] !== undefined) {
          i++;
        }
      }
      return i;
    },
  },
});
module.exports = DataManager;
