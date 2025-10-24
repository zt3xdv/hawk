var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');
var Circle = new Class({
  Extends: Controller,
  initialize: function Circle(
    gameObject,
    thickness,
    color,
    backgroundColor,
    scale,
    feather,
  ) {
    if (thickness === undefined) {
      thickness = 8;
    }
    if (scale === undefined) {
      scale = 1;
    }
    if (feather === undefined) {
      feather = 0.005;
    }
    Controller.call(this, FX_CONST.CIRCLE, gameObject);
    this.scale = scale;
    this.feather = feather;
    this.thickness = thickness;
    this.glcolor = [1, 0.2, 0.7];
    this.glcolor2 = [1, 0, 0, 0.4];
    if (color !== undefined && color !== null) {
      this.color = color;
    }
    if (backgroundColor !== undefined && backgroundColor !== null) {
      this.backgroundColor = backgroundColor;
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
  backgroundColor: {
    get: function () {
      var color = this.glcolor2;
      return (
        ((color[0] * 255) << 16) +
        ((color[1] * 255) << 8) +
        ((color[2] * 255) | 0)
      );
    },
    set: function (value) {
      var color = this.glcolor2;
      color[0] = ((value >> 16) & 0xff) / 255;
      color[1] = ((value >> 8) & 0xff) / 255;
      color[2] = (value & 0xff) / 255;
    },
  },
  backgroundAlpha: {
    get: function () {
      return this.glcolor2[3];
    },
    set: function (value) {
      this.glcolor2[3] = value;
    },
  },
});
module.exports = Circle;
