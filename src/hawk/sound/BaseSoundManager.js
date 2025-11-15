var Class = require('../utils/Class');
var Clone = require('../utils/object/Clone');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var GameEvents = require('../core/events');
var GetAll = require('../utils/array/GetAll');
var GetFirst = require('../utils/array/GetFirst');
var NOOP = require('../utils/NOOP');
var Vector2 = require('../math/Vector2');
var BaseSoundManager = new Class({
  Extends: EventEmitter,
  initialize: function BaseSoundManager(game) {
    EventEmitter.call(this);
    this.game = game;
    this.jsonCache = game.cache.json;
    this.sounds = [];
    this.mute = false;
    this.volume = 1;
    this.pauseOnBlur = true;
    this._rate = 1;
    this._detune = 0;
    this.locked = this.locked || false;
    this.unlocked = false;
    this.gameLostFocus = false;
    this.listenerPosition = new Vector2();
    var ee = game.events;
    ee.on(GameEvents.BLUR, this.onGameBlur, this);
    ee.on(GameEvents.FOCUS, this.onGameFocus, this);
    ee.on(GameEvents.PRE_STEP, this.update, this);
    ee.once(GameEvents.DESTROY, this.destroy, this);
  },
  add: NOOP,
  addAudioSprite: function (key, config) {
    if (config === undefined) {
      config = {};
    }
    var sound = this.add(key, config);
    sound.spritemap = this.jsonCache.get(key).spritemap;
    for (var markerName in sound.spritemap) {
      if (!sound.spritemap.hasOwnProperty(markerName)) {
        continue;
      }
      var markerConfig = Clone(config);
      var marker = sound.spritemap[markerName];
      markerConfig.loop = marker.hasOwnProperty('loop') ? marker.loop : false;
      sound.addMarker({
        name: markerName,
        start: marker.start,
        duration: marker.end - marker.start,
        config: markerConfig,
      });
    }
    return sound;
  },
  get: function (key) {
    return GetFirst(this.sounds, 'key', key);
  },
  getAll: function (key) {
    if (key) {
      return GetAll(this.sounds, 'key', key);
    } else {
      return GetAll(this.sounds);
    }
  },
  getAllPlaying: function () {
    return GetAll(this.sounds, 'isPlaying', true);
  },
  play: function (key, extra) {
    var sound = this.add(key);
    sound.once(Events.COMPLETE, sound.destroy, sound);
    if (extra) {
      if (extra.name) {
        sound.addMarker(extra);
        return sound.play(extra.name);
      } else {
        return sound.play(extra);
      }
    } else {
      return sound.play();
    }
  },
  playAudioSprite: function (key, spriteName, config) {
    var sound = this.addAudioSprite(key);
    sound.once(Events.COMPLETE, sound.destroy, sound);
    return sound.play(spriteName, config);
  },
  remove: function (sound) {
    var index = this.sounds.indexOf(sound);
    if (index !== -1) {
      sound.destroy();
      this.sounds.splice(index, 1);
      return true;
    }
    return false;
  },
  removeAll: function () {
    this.sounds.forEach(function (sound) {
      sound.destroy();
    });
    this.sounds.length = 0;
  },
  removeByKey: function (key) {
    var removed = 0;
    for (var i = this.sounds.length - 1; i >= 0; i--) {
      var sound = this.sounds[i];
      if (sound.key === key) {
        sound.destroy();
        this.sounds.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
  pauseAll: function () {
    this.forEachActiveSound(function (sound) {
      sound.pause();
    });
    this.emit(Events.PAUSE_ALL, this);
  },
  resumeAll: function () {
    this.forEachActiveSound(function (sound) {
      sound.resume();
    });
    this.emit(Events.RESUME_ALL, this);
  },
  setListenerPosition: NOOP,
  stopAll: function () {
    this.forEachActiveSound(function (sound) {
      sound.stop();
    });
    this.emit(Events.STOP_ALL, this);
  },
  stopByKey: function (key) {
    var stopped = 0;
    this.getAll(key).forEach(function (sound) {
      if (sound.stop()) {
        stopped++;
      }
    });
    return stopped;
  },
  isPlaying: function (key) {
    var sounds = this.sounds;
    var i = sounds.length - 1;
    var sound;
    if (key === undefined) {
      for (; i >= 0; i--) {
        sound = this.sounds[i];
        if (sound.isPlaying) {
          return true;
        }
      }
    } else {
      for (; i >= 0; i--) {
        sound = this.sounds[i];
        if (sound.key === key && sound.isPlaying) {
          return true;
        }
      }
    }
    return false;
  },
  unlock: NOOP,
  onBlur: NOOP,
  onFocus: NOOP,
  onGameBlur: function () {
    this.gameLostFocus = true;
    if (this.pauseOnBlur) {
      this.onBlur();
    }
  },
  onGameFocus: function () {
    this.gameLostFocus = false;
    if (this.pauseOnBlur) {
      this.onFocus();
    }
  },
  update: function (time, delta) {
    if (this.unlocked) {
      this.unlocked = false;
      this.locked = false;
      this.emit(Events.UNLOCKED, this);
    }
    for (var i = this.sounds.length - 1; i >= 0; i--) {
      if (this.sounds[i].pendingRemove) {
        this.sounds.splice(i, 1);
      }
    }
    this.sounds.forEach(function (sound) {
      sound.update(time, delta);
    });
  },
  destroy: function () {
    this.game.events.off(GameEvents.BLUR, this.onGameBlur, this);
    this.game.events.off(GameEvents.FOCUS, this.onGameFocus, this);
    this.game.events.off(GameEvents.PRE_STEP, this.update, this);
    this.removeAllListeners();
    this.removeAll();
    this.sounds.length = 0;
    this.sounds = null;
    this.listenerPosition = null;
    this.game = null;
  },
  forEachActiveSound: function (callback, scope) {
    var _this = this;
    this.sounds.forEach(function (sound, index) {
      if (sound && !sound.pendingRemove) {
        callback.call(scope || _this, sound, index, _this.sounds);
      }
    });
  },
  setRate: function (value) {
    this.rate = value;
    return this;
  },
  rate: {
    get: function () {
      return this._rate;
    },
    set: function (value) {
      this._rate = value;
      this.forEachActiveSound(function (sound) {
        sound.calculateRate();
      });
      this.emit(Events.GLOBAL_RATE, this, value);
    },
  },
  setDetune: function (value) {
    this.detune = value;
    return this;
  },
  detune: {
    get: function () {
      return this._detune;
    },
    set: function (value) {
      this._detune = value;
      this.forEachActiveSound(function (sound) {
        sound.calculateRate();
      });
      this.emit(Events.GLOBAL_DETUNE, this, value);
    },
  },
});
module.exports = BaseSoundManager;
