var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');
var Vignette = new Class({
  Extends: Controller,
  initialize: function Vignette(gameObject, x, y, radius, strength) {
    if (x === undefined) {
      x = 0.5;
    }
    if (y === undefined) {
      y = 0.5;
    }
    if (radius === undefined) {
      radius = 0.5;
    }
    if (strength === undefined) {
      strength = 0.5;
    }
    Controller.call(this, FX_CONST.VIGNETTE, gameObject);
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.strength = strength;
  },
});
module.exports = Vignette;
