var Class = require('../utils/Class');
var PluginCache = require('../plugins/PluginCache');
var SceneEvents = require('../scene/events');
var TimerEvent = require('./TimerEvent');
var Remove = require('../utils/array/Remove');
var Clock = new Class({
  initialize: function Clock(scene) {
    this.scene = scene;
    this.systems = scene.sys;
    this.now = 0;
    this.startTime = 0;
    this.timeScale = 1;
    this.paused = false;
    this._active = [];
    this._pendingInsertion = [];
    this._pendingRemoval = [];
    scene.sys.events.once(SceneEvents.BOOT, this.boot, this);
    scene.sys.events.on(SceneEvents.START, this.start, this);
  },
  boot: function () {
    this.now = this.systems.game.loop.time;
    this.systems.events.once(SceneEvents.DESTROY, this.destroy, this);
  },
  start: function () {
    this.startTime = this.systems.game.loop.time;
    var eventEmitter = this.systems.events;
    eventEmitter.on(SceneEvents.PRE_UPDATE, this.preUpdate, this);
    eventEmitter.on(SceneEvents.UPDATE, this.update, this);
    eventEmitter.once(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  addEvent: function (config) {
    var event;
    if (config instanceof TimerEvent) {
      event = config;
      this.removeEvent(event);
      event.elapsed = event.startAt;
      event.hasDispatched = false;
      event.repeatCount =
        event.repeat === -1 || event.loop ? 999999999999 : event.repeat;
      if (event.delay <= 0 && event.repeatCount > 0) {
        throw new Error('TimerEvent infinite loop created via zero delay');
      }
    } else {
      event = new TimerEvent(config);
    }
    this._pendingInsertion.push(event);
    return event;
  },
  delayedCall: function (delay, callback, args, callbackScope) {
    return this.addEvent({
      delay: delay,
      callback: callback,
      args: args,
      callbackScope: callbackScope,
    });
  },
  clearPendingEvents: function () {
    this._pendingInsertion = [];
    return this;
  },
  removeEvent: function (events) {
    if (!Array.isArray(events)) {
      events = [events];
    }
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      Remove(this._pendingRemoval, event);
      Remove(this._pendingInsertion, event);
      Remove(this._active, event);
    }
    return this;
  },
  removeAllEvents: function () {
    this._pendingRemoval = this._pendingRemoval.concat(this._active);
    return this;
  },
  preUpdate: function () {
    var toRemove = this._pendingRemoval.length;
    var toInsert = this._pendingInsertion.length;
    if (toRemove === 0 && toInsert === 0) {
      return;
    }
    var i;
    var event;
    for (i = 0; i < toRemove; i++) {
      event = this._pendingRemoval[i];
      var index = this._active.indexOf(event);
      if (index > -1) {
        this._active.splice(index, 1);
      }
      event.destroy();
    }
    for (i = 0; i < toInsert; i++) {
      event = this._pendingInsertion[i];
      this._active.push(event);
    }
    this._pendingRemoval.length = 0;
    this._pendingInsertion.length = 0;
  },
  update: function (time, delta) {
    this.now = time;
    if (this.paused) {
      return;
    }
    delta *= this.timeScale;
    for (var i = 0; i < this._active.length; i++) {
      var event = this._active[i];
      if (event.paused) {
        continue;
      }
      event.elapsed += delta * event.timeScale;
      if (event.elapsed >= event.delay) {
        var remainder = event.elapsed - event.delay;
        event.elapsed = event.delay;
        if (!event.hasDispatched && event.callback) {
          event.hasDispatched = true;
          event.callback.apply(event.callbackScope, event.args);
        }
        if (event.repeatCount > 0) {
          event.repeatCount--;
          if (remainder >= event.delay) {
            while (remainder >= event.delay && event.repeatCount > 0) {
              if (event.callback) {
                event.callback.apply(event.callbackScope, event.args);
              }
              remainder -= event.delay;
              event.repeatCount--;
            }
          }
          event.elapsed = remainder;
          event.hasDispatched = false;
        } else if (event.hasDispatched) {
          this._pendingRemoval.push(event);
        }
      }
    }
  },
  shutdown: function () {
    var i;
    for (i = 0; i < this._pendingInsertion.length; i++) {
      this._pendingInsertion[i].destroy();
    }
    for (i = 0; i < this._active.length; i++) {
      this._active[i].destroy();
    }
    for (i = 0; i < this._pendingRemoval.length; i++) {
      this._pendingRemoval[i].destroy();
    }
    this._active.length = 0;
    this._pendingRemoval.length = 0;
    this._pendingInsertion.length = 0;
    var eventEmitter = this.systems.events;
    eventEmitter.off(SceneEvents.PRE_UPDATE, this.preUpdate, this);
    eventEmitter.off(SceneEvents.UPDATE, this.update, this);
    eventEmitter.off(SceneEvents.SHUTDOWN, this.shutdown, this);
  },
  destroy: function () {
    this.shutdown();
    this.scene.sys.events.off(SceneEvents.START, this.start, this);
    this.scene = null;
    this.systems = null;
  },
});
PluginCache.register('Clock', Clock, 'time');
module.exports = Clock;
