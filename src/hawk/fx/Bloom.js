var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');
var Bloom = new Class({
  Extends: Controller,
  initialize: function Bloom(
    gameObject,
    color,
    offsetX,
    offsetY,
    blurStrength,
    strength,
    steps,
  ) {
    if (offsetX === undefined) {
      offsetX = 1;
    }
    if (offsetY === undefined) {
      offsetY = 1;
    }
    if (blurStrength === undefined) {
      blurStrength = 1;
    }
    if (strength === undefined) {
      strength = 1;
    }
    if (steps === undefined) {
      steps = 4;
    }
    Controller.call(this, FX_CONST.BLOOM, gameObject);
    this.steps = steps;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.blurStrength = blurStrength;
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
module.exports = Bloom;
