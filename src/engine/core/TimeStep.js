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
    this.callback = NOOP;
    this.lastTime = 0;
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
    var delta = timestamp - this.lastTime;
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
});
