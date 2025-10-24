var Class = require('../utils/Class');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var ProcessQueue = new Class({
  Extends: EventEmitter,
  initialize: function ProcessQueue() {
    EventEmitter.call(this);
    this._pending = [];
    this._active = [];
    this._destroy = [];
    this._toProcess = 0;
    this.checkQueue = false;
  },
  isActive: function (item) {
    return this._active.indexOf(item) > -1;
  },
  isPending: function (item) {
    return this._toProcess > 0 && this._pending.indexOf(item) > -1;
  },
  isDestroying: function (item) {
    return this._destroy.indexOf(item) > -1;
  },
  add: function (item) {
    if (
      (this.checkQueue && this.isActive(item) && !this.isDestroying(item)) ||
      this.isPending(item)
    ) {
      return item;
    }
    this._pending.push(item);
    this._toProcess++;
    return item;
  },
  remove: function (item) {
    if (this.isPending(item)) {
      var pending = this._pending;
      var idx = pending.indexOf(item);
      if (idx !== -1) {
        pending.splice(idx, 1);
      }
    } else if (this.isActive(item)) {
      this._destroy.push(item);
      this._toProcess++;
    }
    return item;
  },
  removeAll: function () {
    var list = this._active;
    var destroy = this._destroy;
    var i = list.length;
    while (i--) {
      destroy.push(list[i]);
      this._toProcess++;
    }
    return this;
  },
  update: function () {
    if (this._toProcess === 0) {
      return this._active;
    }
    var list = this._destroy;
    var active = this._active;
    var i;
    var item;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      var idx = active.indexOf(item);
      if (idx !== -1) {
        active.splice(idx, 1);
        this.emit(Events.PROCESS_QUEUE_REMOVE, item);
      }
    }
    list.length = 0;
    list = this._pending;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      if (
        !this.checkQueue ||
        (this.checkQueue && active.indexOf(item) === -1)
      ) {
        active.push(item);
        this.emit(Events.PROCESS_QUEUE_ADD, item);
      }
    }
    list.length = 0;
    this._toProcess = 0;
    return active;
  },
  getActive: function () {
    return this._active;
  },
  length: {
    get: function () {
      return this._active.length;
    },
  },
  destroy: function () {
    this._toProcess = 0;
    this._pending = [];
    this._active = [];
    this._destroy = [];
  },
});
module.exports = ProcessQueue;
