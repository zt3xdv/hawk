var Animation = require('./Animation');
var Class = require('../utils/Class');
var CustomMap = require('../structs/Map');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var GameEvents = require('../core/events');
var GetFastValue = require('../utils/object/GetFastValue');
var GetValue = require('../utils/object/GetValue');
var MATH_CONST = require('../math/const');
var NumberArray = require('../utils/array/NumberArray');
var Pad = require('../utils/string/Pad');
var AnimationManager = new Class({
  Extends: EventEmitter,
  initialize: function AnimationManager(game) {
    EventEmitter.call(this);
    this.game = game;
    this.textureManager = null;
    this.globalTimeScale = 1;
    this.anims = new CustomMap();
    this.mixes = new CustomMap();
    this.paused = false;
    this.name = 'AnimationManager';
    game.events.once(GameEvents.BOOT, this.boot, this);
  },
  boot: function () {
    this.textureManager = this.game.textures;
    this.game.events.once(GameEvents.DESTROY, this.destroy, this);
  },
  addMix: function (animA, animB, delay) {
    var anims = this.anims;
    var mixes = this.mixes;
    var keyA = typeof animA === 'string' ? animA : animA.key;
    var keyB = typeof animB === 'string' ? animB : animB.key;
    if (anims.has(keyA) && anims.has(keyB)) {
      var mixObj = mixes.get(keyA);
      if (!mixObj) {
        mixObj = {};
      }
      mixObj[keyB] = delay;
      mixes.set(keyA, mixObj);
    }
    return this;
  },
  removeMix: function (animA, animB) {
    var mixes = this.mixes;
    var keyA = typeof animA === 'string' ? animA : animA.key;
    var mixObj = mixes.get(keyA);
    if (mixObj) {
      if (animB) {
        var keyB = typeof animB === 'string' ? animB : animB.key;
        if (mixObj.hasOwnProperty(keyB)) {
          delete mixObj[keyB];
        }
      } else if (!animB) {
        mixes.delete(keyA);
      }
    }
    return this;
  },
  getMix: function (animA, animB) {
    var mixes = this.mixes;
    var keyA = typeof animA === 'string' ? animA : animA.key;
    var keyB = typeof animB === 'string' ? animB : animB.key;
    var mixObj = mixes.get(keyA);
    if (mixObj && mixObj.hasOwnProperty(keyB)) {
      return mixObj[keyB];
    } else {
      return 0;
    }
  },
  add: function (key, animation) {
    if (this.anims.has(key)) {
      console.warn('Animation key exists: ' + key);
      return this;
    }
    animation.key = key;
    this.anims.set(key, animation);
    this.emit(Events.ADD_ANIMATION, key, animation);
    return this;
  },
  exists: function (key) {
    return this.anims.has(key);
  },
  createFromAseprite: function (key, tags, target) {
    var output = [];
    var data = this.game.cache.json.get(key);
    if (!data) {
      console.warn('No Aseprite data found for: ' + key);
      return output;
    }
    var _this = this;
    var meta = GetValue(data, 'meta', null);
    var frames = GetValue(data, 'frames', null);
    if (meta && frames) {
      var frameTags = GetValue(meta, 'frameTags', []);
      frameTags.forEach(function (tag) {
        var animFrames = [];
        var name = GetFastValue(tag, 'name', null);
        var from = GetFastValue(tag, 'from', 0);
        var to = GetFastValue(tag, 'to', 0);
        var direction = GetFastValue(tag, 'direction', 'forward');
        if (!name) {
          return;
        }
        if (!tags || (tags && tags.indexOf(name) > -1)) {
          var totalDuration = 0;
          for (var i = from; i <= to; i++) {
            var frameKey = i.toString();
            var frame = frames[frameKey];
            if (frame) {
              var frameDuration = GetFastValue(
                frame,
                'duration',
                MATH_CONST.MAX_SAFE_INTEGER,
              );
              animFrames.push({
                key: key,
                frame: frameKey,
                duration: frameDuration,
              });
              totalDuration += frameDuration;
            }
          }
          if (direction === 'reverse') {
            animFrames = animFrames.reverse();
          }
          var createConfig = {
            key: name,
            frames: animFrames,
            duration: totalDuration,
            yoyo: direction === 'pingpong',
          };
          var result;
          if (target) {
            if (target.anims) {
              result = target.anims.create(createConfig);
            }
          } else {
            result = _this.create(createConfig);
          }
          if (result) {
            output.push(result);
          }
        }
      });
    }
    return output;
  },
  create: function (config) {
    var key = config.key;
    var anim = false;
    if (key) {
      anim = this.get(key);
      if (!anim) {
        anim = new Animation(this, key, config);
        this.anims.set(key, anim);
        this.emit(Events.ADD_ANIMATION, key, anim);
      } else {
        console.warn('AnimationManager key already exists: ' + key);
      }
    }
    return anim;
  },
  fromJSON: function (data, clearCurrentAnimations) {
    if (clearCurrentAnimations === undefined) {
      clearCurrentAnimations = false;
    }
    if (clearCurrentAnimations) {
      this.anims.clear();
    }
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    var output = [];
    if (data.hasOwnProperty('anims') && Array.isArray(data.anims)) {
      for (var i = 0; i < data.anims.length; i++) {
        output.push(this.create(data.anims[i]));
      }
      if (data.hasOwnProperty('globalTimeScale')) {
        this.globalTimeScale = data.globalTimeScale;
      }
    } else if (data.hasOwnProperty('key') && data.type === 'frame') {
      output.push(this.create(data));
    }
    return output;
  },
  generateFrameNames: function (key, config) {
    var prefix = GetValue(config, 'prefix', '');
    var start = GetValue(config, 'start', 0);
    var end = GetValue(config, 'end', 0);
    var suffix = GetValue(config, 'suffix', '');
    var zeroPad = GetValue(config, 'zeroPad', 0);
    var out = GetValue(config, 'outputArray', []);
    var frames = GetValue(config, 'frames', false);
    if (!this.textureManager.exists(key)) {
      console.warn('Texture "%s" not found', key);
      return out;
    }
    var texture = this.textureManager.get(key);
    if (!texture) {
      return out;
    }
    var i;
    if (!config) {
      frames = texture.getFrameNames();
      for (i = 0; i < frames.length; i++) {
        out.push({ key: key, frame: frames[i] });
      }
    } else {
      if (!frames) {
        frames = NumberArray(start, end);
      }
      for (i = 0; i < frames.length; i++) {
        var frame = prefix + Pad(frames[i], zeroPad, '0', 1) + suffix;
        if (texture.has(frame)) {
          out.push({ key: key, frame: frame });
        } else {
          console.warn('Frame "%s" not found in texture "%s"', frame, key);
        }
      }
    }
    return out;
  },
  generateFrameNumbers: function (key, config) {
    var start = GetValue(config, 'start', 0);
    var end = GetValue(config, 'end', -1);
    var first = GetValue(config, 'first', false);
    var out = GetValue(config, 'outputArray', []);
    var frames = GetValue(config, 'frames', false);
    if (!this.textureManager.exists(key)) {
      console.warn('Texture "%s" not found', key);
      return out;
    }
    var texture = this.textureManager.get(key);
    if (!texture) {
      return out;
    }
    if (first && texture.has(first)) {
      out.push({ key: key, frame: first });
    }
    if (!frames) {
      if (end === -1) {
        end = texture.frameTotal - 2;
      }
      frames = NumberArray(start, end);
    }
    for (var i = 0; i < frames.length; i++) {
      var frameName = frames[i];
      if (texture.has(frameName)) {
        out.push({ key: key, frame: frameName });
      } else {
        console.warn('Frame "%s" not found in texture "%s"', frameName, key);
      }
    }
    return out;
  },
  get: function (key) {
    return this.anims.get(key);
  },
  getAnimsFromTexture: function (key) {
    var texture = this.textureManager.get(key);
    var match = texture.key;
    var anims = this.anims.getArray();
    var out = [];
    for (var i = 0; i < anims.length; i++) {
      var anim = anims[i];
      var frames = anim.frames;
      for (var c = 0; c < frames.length; c++) {
        if (frames[c].textureKey === match) {
          out.push(anim.key);
          break;
        }
      }
    }
    return out;
  },
  pauseAll: function () {
    if (!this.paused) {
      this.paused = true;
      this.emit(Events.PAUSE_ALL);
    }
    return this;
  },
  play: function (key, children) {
    if (!Array.isArray(children)) {
      children = [children];
    }
    for (var i = 0; i < children.length; i++) {
      children[i].anims.play(key);
    }
    return this;
  },
  staggerPlay: function (key, children, stagger, staggerFirst) {
    if (stagger === undefined) {
      stagger = 0;
    }
    if (staggerFirst === undefined) {
      staggerFirst = true;
    }
    if (!Array.isArray(children)) {
      children = [children];
    }
    var len = children.length;
    if (!staggerFirst) {
      len--;
    }
    for (var i = 0; i < children.length; i++) {
      var time = stagger < 0 ? Math.abs(stagger) * (len - i) : stagger * i;
      children[i].anims.playAfterDelay(key, time);
    }
    return this;
  },
  remove: function (key) {
    var anim = this.get(key);
    if (anim) {
      this.emit(Events.REMOVE_ANIMATION, key, anim);
      this.anims.delete(key);
      this.removeMix(key);
    }
    return anim;
  },
  resumeAll: function () {
    if (this.paused) {
      this.paused = false;
      this.emit(Events.RESUME_ALL);
    }
    return this;
  },
  toJSON: function (key) {
    var output = { anims: [], globalTimeScale: this.globalTimeScale };
    if (key !== undefined && key !== '') {
      output.anims.push(this.anims.get(key).toJSON());
    } else {
      this.anims.each(function (animationKey, animation) {
        output.anims.push(animation.toJSON());
      });
    }
    return output;
  },
  destroy: function () {
    this.anims.clear();
    this.mixes.clear();
    this.textureManager = null;
    this.game = null;
  },
});
module.exports = AnimationManager;
