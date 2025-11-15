var Class = require('../utils/Class');
var GetFastValue = require('../utils/object/GetFastValue');
var TimerEvent = new Class({
  initialize: function TimerEvent(config) {
    this.delay = 0;
    this.repeat = 0;
    this.repeatCount = 0;
    this.loop = false;
    this.callback;
    this.callbackScope;
    this.args;
    this.timeScale = 1;
    this.startAt = 0;
    this.elapsed = 0;
    this.paused = false;
    this.hasDispatched = false;
    this.reset(config);
  },
  reset: function (config) {
    this.delay = GetFastValue(config, 'delay', 0);
    this.repeat = GetFastValue(config, 'repeat', 0);
    this.loop = GetFastValue(config, 'loop', false);
    this.callback = GetFastValue(config, 'callback', undefined);
    this.callbackScope = GetFastValue(config, 'callbackScope', this);
    this.args = GetFastValue(config, 'args', []);
    this.timeScale = GetFastValue(config, 'timeScale', 1);
    this.startAt = GetFastValue(config, 'startAt', 0);
    this.paused = GetFastValue(config, 'paused', false);
    this.elapsed = this.startAt;
    this.hasDispatched = false;
    this.repeatCount =
      this.repeat === -1 || this.loop ? 999999999999 : this.repeat;
    if (this.delay <= 0 && this.repeatCount > 0) {
      throw new Error('TimerEvent infinite loop created via zero delay');
    }
    return this;
  },
  getProgress: function () {
    return this.elapsed / this.delay;
  },
  getOverallProgress: function () {
    if (this.repeat > 0) {
      var totalDuration = this.delay + this.delay * this.repeat;
      var totalElapsed =
        this.elapsed + this.delay * (this.repeat - this.repeatCount);
      return totalElapsed / totalDuration;
    } else {
      return this.getProgress();
    }
  },
  getRepeatCount: function () {
    return this.repeatCount;
  },
  getElapsed: function () {
    return this.elapsed;
  },
  getElapsedSeconds: function () {
    return this.elapsed * 0.001;
  },
  getRemaining: function () {
    return this.delay - this.elapsed;
  },
  getRemainingSeconds: function () {
    return this.getRemaining() * 0.001;
  },
  getOverallRemaining: function () {
    return this.delay * (1 + this.repeatCount) - this.elapsed;
  },
  getOverallRemainingSeconds: function () {
    return this.getOverallRemaining() * 0.001;
  },
  remove: function (dispatchCallback) {
    if (dispatchCallback === undefined) {
      dispatchCallback = false;
    }
    this.elapsed = this.delay;
    this.hasDispatched = !dispatchCallback;
    this.repeatCount = 0;
  },
  destroy: function () {
    this.callback = undefined;
    this.callbackScope = undefined;
    this.args = [];
  },
});
module.exports = TimerEvent;
