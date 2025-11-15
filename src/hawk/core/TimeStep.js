var Class = require('../utils/Class');
var GetValue = require('../utils/object/GetValue');
var NOOP = require('../utils/NOOP');
var RequestAnimationFrame = require('../dom/RequestAnimationFrame');

var TimeStep = new Class({
  initialize: function TimeStep(game, config) {
    this.game = game;
    this.rafId = null;
    this.started = false;
    this.running = false;
    this.paused = false;
    this.callback = NOOP;
    this.lastTime = 0;
    this.frameCount = 0;
    this.deltaHistory = [];
    this.deltaSmoothingMax = 10;
    this.fps = 0;
  },

  start: function (callback) {
    if (this.started) return this;
    this.started = true;
    this.running = true;
    this.callback = callback;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  },

  tick: function (timestamp) {
    if (this.paused) return;
    var delta = timestamp - this.lastTime;
    this.deltaHistory.push(delta);
    if (this.deltaHistory.length > this.deltaSmoothingMax) {
      this.deltaHistory.shift();
    }
    var deltaAverage = this.deltaHistory.reduce((a, b) => a + b, 0) / this.deltaHistory.length;
    this.fps = Math.round(1000 / deltaAverage);
    this.frameCount++;
    this.callback(timestamp, delta);
    this.lastTime = timestamp;
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  },

  stop: function () {
    if (this.running) {
      cancelAnimationFrame(this.rafId);
      this.running = false;
    }
  },

  destroy: function () {
    this.stop();
  },

  focus: function () {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
  },

  resume: function () {
    this.focus();
  },

  blur: function () {
    this.pause();
  },

  pause: function () {
    this.paused = true;
    cancelAnimationFrame(this.rafId);
  },

  getFPS: function () {
    return this.fps;
  }
});

module.exports = TimeStep;