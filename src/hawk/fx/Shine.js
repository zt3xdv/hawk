var Class = require('../utils/Class');
var Controller = require('./Controller');
var FX_CONST = require('./const');
var Shine = new Class({
  Extends: Controller,
  initialize: function Shine(gameObject, speed, lineWidth, gradient, reveal) {
    if (speed === undefined) {
      speed = 0.5;
    }
    if (lineWidth === undefined) {
      lineWidth = 0.5;
    }
    if (gradient === undefined) {
      gradient = 3;
    }
    if (reveal === undefined) {
      reveal = false;
    }
    Controller.call(this, FX_CONST.SHINE, gameObject);
    this.speed = speed;
    this.lineWidth = lineWidth;
    this.gradient = gradient;
    this.reveal = reveal;
  },
});
module.exports = Shine;
