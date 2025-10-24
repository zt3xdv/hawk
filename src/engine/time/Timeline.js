var Class = require('../utils/Class');
var EventEmitter = require('eventemitter3');
var GameObjectFactory = require('../gameobjects/GameObjectFactory');
var GetFastValue = require('../utils/object/GetFastValue');
var SceneEvents = require('../scene/events');
var Events = require('./events');
var Timeline = new Class({
  Extends: EventEmitter,
  initialize: function Timeline(scene, config) {
    EventEmitter.call(this);
    this.scene = scene;
    this.systems = scene.sys;
    this.elapsed = 0;
    this.timeScale = 1;
    this.paused = true;
    this.complete = false;
    this.totalComplete = 0;
    this.loop = 0;
    this.iteration = 0;
    this.events = [];
    var eventEmitter = this.systems.events;
    eventEmitter.on(SceneEvents.PRE_UPDATE, this.preUpdate, this);
    eventEmitter.on(SceneEvents.UPDATE, this.update, this);
    eventEmitter.once(SceneEvents.SHUTDOWN, this.destroy, this);
    if (config) {
      this.add(config);
    }
  },
  preUpdate: function (time, delta) {
    if (this.paused) {
      return;
    }
    this.elapsed += delta * this.timeScale;
  },
  update: function () {
    if (this.paused || this.complete) {
      return;
    }
    var i;
    var events = this.events;
    var removeSweep = false;
    var sys = this.systems;
    var target;
    for (i = 0; i < events.length; i++) {
      var event = events[i];
      if (!event.complete && event.time <= this.elapsed) {
        event.complete = true;
        this.totalComplete++;
        target = event.target ? event.target : this;
        if (event.if) {
          if (!event.if.call(target, event)) {
            continue;
          }
        }
        if (event.once) {
          removeSweep = true;
        }
        if (event.set && event.target) {
          for (var key in event.set) {
            event.target[key] = event.set[key];
          }
        }
        if (this.iteration) {
          event.repeat++;
        }
        if (event.loop && event.repeat) {
          event.loop.call(target);
        }
        if (event.tween) {
          event.tweenInstance = sys.tweens.add(event.tween);
        }
        if (event.sound) {
          if (typeof event.sound === 'string') {
            sys.sound.play(event.sound);
          } else {
            sys.sound.play(event.sound.key, event.sound.config);
          }
        }
        if (event.event) {
          this.emit(event.event, target);
        }
        if (event.run) {
          event.run.call(target);
        }
        if (event.stop) {
          this.stop();
        }
      }
    }
    if (removeSweep) {
      for (i = 0; i < events.length; i++) {
        if (events[i].complete && events[i].once) {
          events.splice(i, 1);
          i--;
        }
      }
    }
    if (this.totalComplete >= events.length) {
      if (this.loop !== 0 && (this.loop === -1 || this.loop > this.iteration)) {
        this.iteration++;
        this.reset(true);
      } else {
        this.complete = true;
      }
    }
    if (this.complete) {
      this.emit(Events.COMPLETE, this);
    }
  },
  play: function (fromStart) {
    if (fromStart === undefined) {
      fromStart = true;
    }
    this.paused = false;
    this.complete = false;
    this.totalComplete = 0;
    if (fromStart) {
      this.reset();
    }
    return this;
  },
  pause: function () {
    this.paused = true;
    var events = this.events;
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.tweenInstance) {
        event.tweenInstance.paused = true;
      }
    }
    return this;
  },
  repeat: function (amount) {
    if (amount === undefined || amount === true) {
      amount = -1;
    }
    if (amount === false) {
      amount = 0;
    }
    this.loop = amount;
    return this;
  },
  resume: function () {
    this.paused = false;
    var events = this.events;
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.tweenInstance) {
        event.tweenInstance.paused = false;
      }
    }
    return this;
  },
  stop: function () {
    this.paused = true;
    this.complete = true;
    return this;
  },
  reset: function (loop) {
    if (loop === undefined) {
      loop = false;
    }
    this.elapsed = 0;
    if (!loop) {
      this.iteration = 0;
    }
    var events = this.events;
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      event.complete = false;
      if (!loop) {
        event.repeat = 0;
      }
      if (event.tweenInstance) {
        event.tweenInstance.stop();
      }
    }
    return this.play(false);
  },
  add: function (config) {
    if (!Array.isArray(config)) {
      config = [config];
    }
    var events = this.events;
    var prevTime = 0;
    if (events.length > 0) {
      prevTime = events[events.length - 1].time;
    }
    for (var i = 0; i < config.length; i++) {
      var entry = config[i];
      var startTime = GetFastValue(entry, 'at', 0);
      var offsetTime = GetFastValue(entry, 'in', null);
      if (offsetTime !== null) {
        startTime = this.elapsed + offsetTime;
      }
      var fromTime = GetFastValue(entry, 'from', null);
      if (fromTime !== null) {
        startTime = prevTime + fromTime;
      }
      events.push({
        complete: false,
        time: startTime,
        repeat: 0,
        if: GetFastValue(entry, 'if', null),
        run: GetFastValue(entry, 'run', null),
        loop: GetFastValue(entry, 'loop', null),
        event: GetFastValue(entry, 'event', null),
        target: GetFastValue(entry, 'target', null),
        set: GetFastValue(entry, 'set', null),
        tween: GetFastValue(entry, 'tween', null),
        sound: GetFastValue(entry, 'sound', null),
        once: GetFastValue(entry, 'once', false),
        stop: GetFastValue(entry, 'stop', false),
      });
      prevTime = startTime;
    }
    this.complete = false;
    return this;
  },
  clear: function () {
    var events = this.events;
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.tweenInstance) {
        event.tweenInstance.stop();
      }
    }
    events = [];
    this.elapsed = 0;
    this.paused = true;
    return this;
  },
  isPlaying: function () {
    return !this.paused && !this.complete;
  },
  getProgress: function () {
    var total = Math.min(this.totalComplete, this.events.length);
    return total / this.events.length;
  },
  destroy: function () {
    var eventEmitter = this.systems.events;
    eventEmitter.off(SceneEvents.PRE_UPDATE, this.preUpdate, this);
    eventEmitter.off(SceneEvents.UPDATE, this.update, this);
    eventEmitter.off(SceneEvents.SHUTDOWN, this.destroy, this);
    this.clear();
    this.scene = null;
    this.systems = null;
  },
});
GameObjectFactory.register('timeline', function (config) {
  return new Timeline(this.scene, config);
});
module.exports = Timeline;
