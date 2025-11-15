var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');
var Gradient = new Class({
  Extends: Controller,
  initialize: function Gradient(
    gameObject,
    color1,
    color2,
    alpha,
    fromX,
    fromY,
    toX,
    toY,
    size,
  ) {
    if (alpha === undefined) {
      alpha = 0.2;
    }
    if (fromX === undefined) {
      fromX = 0;
    }
    if (fromY === undefined) {
      fromY = 0;
    }
    if (toX === undefined) {
      toX = 0;
    }
    if (toY === undefined) {
      toY = 1;
    }
    if (size === undefined) {
      size = 0;
    }
    Controller.call(this, FX_CONST.GRADIENT, gameObject);
    this.alpha = alpha;
    this.size = size;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.glcolor1 = [255, 0, 0];
    this.glcolor2 = [0, 255, 0];
    if (color1 !== undefined && color1 !== null) {
      this.color1 = color1;
    }
    if (color2 !== undefined && color2 !== null) {
      this.color2 = color2;
    }
  },
  color1: {
    get: function () {
      var color = this.glcolor1;
      return (color[0] << 16) + (color[1] << 8) + (color[2] | 0);
    },
    set: function (value) {
      var color = this.glcolor1;
      color[0] = (value >> 16) & 0xff;
      color[1] = (value >> 8) & 0xff;
      color[2] = value & 0xff;
    },
  },
  color2: {
    get: function () {
      var color = this.glcolor2;
      return (color[0] << 16) + (color[1] << 8) + (color[2] | 0);
    },
    set: function (value) {
      var color = this.glcolor2;
      color[0] = (value >> 16) & 0xff;
      color[1] = (value >> 8) & 0xff;
      color[2] = value & 0xff;
    },
  },
});
module.exports = Gradient;
