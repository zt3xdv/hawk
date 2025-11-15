var Angle = require('../math/angle/Between');
var Class = require('../utils/Class');
var Distance = require('../math/distance/DistanceBetween');
var FuzzyEqual = require('../math/fuzzy/Equal');
var SmoothStepInterpolation = require('../math/interpolation/SmoothStepInterpolation');
var Vector2 = require('../math/Vector2');
var OS = require('../device/OS');
var Pointer = new Class({
  initialize: function Pointer(manager, id) {
    this.manager = manager;
    this.id = id;
    this.event;
    this.downElement;
    this.upElement;
    this.camera = null;
    this.button = 0;
    this.buttons = 0;
    this.position = new Vector2();
    this.prevPosition = new Vector2();
    this.midPoint = new Vector2(-1, -1);
    this.velocity = new Vector2();
    this.angle = 0;
    this.distance = 0;
    this.smoothFactor = 0;
    this.motionFactor = 0.2;
    this.worldX = 0;
    this.worldY = 0;
    this.moveTime = 0;
    this.downX = 0;
    this.downY = 0;
    this.downTime = 0;
    this.upX = 0;
    this.upY = 0;
    this.upTime = 0;
    this.primaryDown = false;
    this.isDown = false;
    this.wasTouch = false;
    this.wasCanceled = false;
    this.movementX = 0;
    this.movementY = 0;
    this.identifier = 0;
    this.pointerId = null;
    this.active = id === 0 ? true : false;
    this.locked = false;
    this.deltaX = 0;
    this.deltaY = 0;
    this.deltaZ = 0;
  },
  updateWorldPoint: function (camera) {
    var temp = camera.getWorldPoint(this.x, this.y);
    this.worldX = temp.x;
    this.worldY = temp.y;
    return this;
  },
  positionToCamera: function (camera, output) {
    return camera.getWorldPoint(this.x, this.y, output);
  },
  updateMotion: function () {
    var cx = this.position.x;
    var cy = this.position.y;
    var mx = this.midPoint.x;
    var my = this.midPoint.y;
    if (cx === mx && cy === my) {
      return;
    }
    var vx = SmoothStepInterpolation(this.motionFactor, mx, cx);
    var vy = SmoothStepInterpolation(this.motionFactor, my, cy);
    if (FuzzyEqual(vx, cx, 0.1)) {
      vx = cx;
    }
    if (FuzzyEqual(vy, cy, 0.1)) {
      vy = cy;
    }
    this.midPoint.set(vx, vy);
    var dx = cx - vx;
    var dy = cy - vy;
    this.velocity.set(dx, dy);
    this.angle = Angle(vx, vy, cx, cy);
    this.distance = Math.sqrt(dx * dx + dy * dy);
  },
  up: function (event) {
    if ('buttons' in event) {
      this.buttons = event.buttons;
    }
    this.event = event;
    this.button = event.button;
    this.upElement = event.target;
    this.manager.transformPointer(this, event.pageX, event.pageY, false);
    if (event.button === 0) {
      this.primaryDown = false;
      this.upX = this.x;
      this.upY = this.y;
    }
    if (this.buttons === 0) {
      this.isDown = false;
      this.upTime = event.timeStamp;
      this.wasTouch = false;
    }
  },
  down: function (event) {
    if ('buttons' in event) {
      this.buttons = event.buttons;
    }
    this.event = event;
    this.button = event.button;
    this.downElement = event.target;
    this.manager.transformPointer(this, event.pageX, event.pageY, false);
    if (event.button === 0) {
      this.primaryDown = true;
      this.downX = this.x;
      this.downY = this.y;
    }
    if (OS.macOS && event.ctrlKey) {
      this.buttons = 2;
      this.primaryDown = false;
    }
    if (!this.isDown) {
      this.isDown = true;
      this.downTime = event.timeStamp;
    }
    this.wasTouch = false;
  },
  move: function (event) {
    if ('buttons' in event) {
      this.buttons = event.buttons;
    }
    this.event = event;
    this.manager.transformPointer(this, event.pageX, event.pageY, true);
    if (this.locked) {
      this.movementX =
        event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      this.movementY =
        event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    }
    this.moveTime = event.timeStamp;
    this.wasTouch = false;
  },
  wheel: function (event) {
    if ('buttons' in event) {
      this.buttons = event.buttons;
    }
    this.event = event;
    this.manager.transformPointer(this, event.pageX, event.pageY, false);
    this.deltaX = event.deltaX;
    this.deltaY = event.deltaY;
    this.deltaZ = event.deltaZ;
    this.wasTouch = false;
  },
  touchstart: function (touch, event) {
    if (touch['pointerId']) {
      this.pointerId = touch.pointerId;
    }
    this.identifier = touch.identifier;
    this.target = touch.target;
    this.active = true;
    this.buttons = 1;
    this.event = event;
    this.downElement = touch.target;
    this.manager.transformPointer(this, touch.pageX, touch.pageY, false);
    this.primaryDown = true;
    this.downX = this.x;
    this.downY = this.y;
    this.downTime = event.timeStamp;
    this.isDown = true;
    this.wasTouch = true;
    this.wasCanceled = false;
    this.updateMotion();
  },
  touchmove: function (touch, event) {
    this.event = event;
    this.manager.transformPointer(this, touch.pageX, touch.pageY, true);
    this.moveTime = event.timeStamp;
    this.wasTouch = true;
    this.updateMotion();
  },
  touchend: function (touch, event) {
    this.buttons = 0;
    this.event = event;
    this.upElement = touch.target;
    this.manager.transformPointer(this, touch.pageX, touch.pageY, false);
    this.primaryDown = false;
    this.upX = this.x;
    this.upY = this.y;
    this.upTime = event.timeStamp;
    this.isDown = false;
    this.wasTouch = true;
    this.wasCanceled = false;
    this.active = false;
    this.updateMotion();
  },
  touchcancel: function (touch, event) {
    this.buttons = 0;
    this.event = event;
    this.upElement = touch.target;
    this.manager.transformPointer(this, touch.pageX, touch.pageY, false);
    this.primaryDown = false;
    this.upX = this.x;
    this.upY = this.y;
    this.upTime = event.timeStamp;
    this.isDown = false;
    this.wasTouch = true;
    this.wasCanceled = true;
    this.active = false;
  },
  noButtonDown: function () {
    return this.buttons === 0;
  },
  leftButtonDown: function () {
    return this.buttons & 1 ? true : false;
  },
  rightButtonDown: function () {
    return this.buttons & 2 ? true : false;
  },
  middleButtonDown: function () {
    return this.buttons & 4 ? true : false;
  },
  backButtonDown: function () {
    return this.buttons & 8 ? true : false;
  },
  forwardButtonDown: function () {
    return this.buttons & 16 ? true : false;
  },
  leftButtonReleased: function () {
    return this.buttons === 0
      ? this.button === 0 && !this.isDown
      : this.button === 0;
  },
  rightButtonReleased: function () {
    return this.buttons === 0
      ? this.button === 2 && !this.isDown
      : this.button === 2;
  },
  middleButtonReleased: function () {
    return this.buttons === 0
      ? this.button === 1 && !this.isDown
      : this.button === 1;
  },
  backButtonReleased: function () {
    return this.buttons === 0
      ? this.button === 3 && !this.isDown
      : this.button === 3;
  },
  forwardButtonReleased: function () {
    return this.buttons === 0
      ? this.button === 4 && !this.isDown
      : this.button === 4;
  },
  getDistance: function () {
    if (this.isDown) {
      return Distance(this.downX, this.downY, this.x, this.y);
    } else {
      return Distance(this.downX, this.downY, this.upX, this.upY);
    }
  },
  getDistanceX: function () {
    if (this.isDown) {
      return Math.abs(this.downX - this.x);
    } else {
      return Math.abs(this.downX - this.upX);
    }
  },
  getDistanceY: function () {
    if (this.isDown) {
      return Math.abs(this.downY - this.y);
    } else {
      return Math.abs(this.downY - this.upY);
    }
  },
  getDuration: function () {
    if (this.isDown) {
      return this.manager.time - this.downTime;
    } else {
      return this.upTime - this.downTime;
    }
  },
  getAngle: function () {
    if (this.isDown) {
      return Angle(this.downX, this.downY, this.x, this.y);
    } else {
      return Angle(this.downX, this.downY, this.upX, this.upY);
    }
  },
  getInterpolatedPosition: function (steps, out) {
    if (steps === undefined) {
      steps = 10;
    }
    if (out === undefined) {
      out = [];
    }
    var prevX = this.prevPosition.x;
    var prevY = this.prevPosition.y;
    var curX = this.position.x;
    var curY = this.position.y;
    for (var i = 0; i < steps; i++) {
      var t = (1 / steps) * i;
      out[i] = {
        x: SmoothStepInterpolation(t, prevX, curX),
        y: SmoothStepInterpolation(t, prevY, curY),
      };
    }
    return out;
  },
  reset: function () {
    this.event = null;
    this.downElement = null;
    this.upElement = null;
    this.button = 0;
    this.buttons = 0;
    this.position.set(0, 0);
    this.prevPosition.set(0, 0);
    this.midPoint.set(-1, -1);
    this.velocity.set(0, 0);
    this.angle = 0;
    this.distance = 0;
    this.worldX = 0;
    this.worldY = 0;
    this.downX = 0;
    this.downY = 0;
    this.upX = 0;
    this.upY = 0;
    this.moveTime = 0;
    this.upTime = 0;
    this.downTime = 0;
    this.primaryDown = false;
    this.isDown = false;
    this.wasTouch = false;
    this.wasCanceled = false;
    this.movementX = 0;
    this.movementY = 0;
    this.identifier = 0;
    this.pointerId = null;
    this.deltaX = 0;
    this.deltaY = 0;
    this.deltaZ = 0;
    this.active = this.id === 0 ? true : false;
  },
  destroy: function () {
    this.camera = null;
    this.manager = null;
    this.position = null;
  },
  x: {
    get: function () {
      return this.position.x;
    },
    set: function (value) {
      this.position.x = value;
    },
  },
  y: {
    get: function () {
      return this.position.y;
    },
    set: function (value) {
      this.position.y = value;
    },
  },
  time: {
    get: function () {
      return this.event ? this.event.timeStamp : 0;
    },
  },
});
module.exports = Pointer;
