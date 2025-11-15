var Class = require('../utils/Class');
var Map = new Class({
  initialize: function Map(elements) {
    this.entries = {};
    this.size = 0;
    this.setAll(elements);
  },
  setAll: function (elements) {
    if (Array.isArray(elements)) {
      for (var i = 0; i < elements.length; i++) {
        this.set(elements[i][0], elements[i][1]);
      }
    }
    return this;
  },
  set: function (key, value) {
    if (!this.has(key)) {
      this.size++;
    }
    this.entries[key] = value;
    return this;
  },
  get: function (key) {
    if (this.has(key)) {
      return this.entries[key];
    }
  },
  getArray: function () {
    var output = [];
    var entries = this.entries;
    for (var key in entries) {
      output.push(entries[key]);
    }
    return output;
  },
  has: function (key) {
    return this.entries.hasOwnProperty(key);
  },
  delete: function (key) {
    if (this.has(key)) {
      delete this.entries[key];
      this.size--;
    }
    return this;
  },
  clear: function () {
    Object.keys(this.entries).forEach(function (prop) {
      delete this.entries[prop];
    }, this);
    this.size = 0;
    return this;
  },
  keys: function () {
    return Object.keys(this.entries);
  },
  values: function () {
    var output = [];
    var entries = this.entries;
    for (var key in entries) {
      output.push(entries[key]);
    }
    return output;
  },
  dump: function () {
    var entries = this.entries;
    console.group('Map');
    for (var key in entries) {
      console.log(key, entries[key]);
    }
    console.groupEnd();
  },
  each: function (callback) {
    var entries = this.entries;
    for (var key in entries) {
      if (callback(key, entries[key]) === false) {
        break;
      }
    }
    return this;
  },
  contains: function (value) {
    var entries = this.entries;
    for (var key in entries) {
      if (entries[key] === value) {
        return true;
      }
    }
    return false;
  },
  merge: function (map, override) {
    if (override === undefined) {
      override = false;
    }
    var local = this.entries;
    var source = map.entries;
    for (var key in source) {
      if (local.hasOwnProperty(key) && override) {
        local[key] = source[key];
      } else {
        this.set(key, source[key]);
      }
    }
    return this;
  },
});
module.exports = Map;
