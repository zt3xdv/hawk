var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');
var Blur = new Class({
  Extends: Controller,
  initialize: function Blur(gameObject, quality, x, y, strength, color, steps) {
    if (quality === undefined) {
      quality = 0;
    }
    if (x === undefined) {
      x = 2;
    }
    if (y === undefined) {
      y = 2;
    }
    if (strength === undefined) {
      strength = 1;
    }
    if (steps === undefined) {
      steps = 4;
    }
    Controller.call(this, FX_CONST.BLUR, gameObject);
    this.quality = quality;
    this.x = x;
    this.y = y;
    this.steps = steps;
    this.strength = strength;
    this.glcolor = [1, 1, 1];
    if (color !== undefined && color !== null) {
      this.color = color;
    }
  },
  color: {
    get: function () {
      var color = this.glcolor;
      return (
        ((color[0] * 255) << 16) +
        ((color[1] * 255) << 8) +
        ((color[2] * 255) | 0)
      );
    },
    set: function (value) {
      var color = this.glcolor;
      color[0] = ((value >> 16) & 0xff) / 255;
      color[1] = ((value >> 8) & 0xff) / 255;
      color[2] = (value & 0xff) / 255;
    },
  },
});
module.exports = Blur;
