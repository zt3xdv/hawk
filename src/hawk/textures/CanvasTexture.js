var Class = require('../utils/Class');
var Clamp = require('../math/Clamp');
var Color = require('../display/color/Color');
var CONST = require('../const');
var IsSizePowerOfTwo = require('../math/pow2/IsSizePowerOfTwo');
var Texture = require('./Texture');
var CanvasTexture = new Class({
  Extends: Texture,
  initialize: function CanvasTexture(manager, key, source, width, height) {
    Texture.call(this, manager, key, source, width, height);
    this.add('__BASE', 0, 0, 0, width, height);
    this._source = this.frames['__BASE'].source;
    this.canvas = this._source.image;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.width = width;
    this.height = height;
    this.imageData = this.context.getImageData(0, 0, width, height);
    this.data = null;
    if (this.imageData) {
      this.data = this.imageData.data;
    }
    this.pixels = null;
    this.buffer;
    if (this.data) {
      if (this.imageData.data.buffer) {
        this.buffer = this.imageData.data.buffer;
        this.pixels = new Uint32Array(this.buffer);
      } else if (window.ArrayBuffer) {
        this.buffer = new ArrayBuffer(this.imageData.data.length);
        this.pixels = new Uint32Array(this.buffer);
      } else {
        this.pixels = this.imageData.data;
      }
    }
  },
  update: function () {
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
    this.data = this.imageData.data;
    if (this.imageData.data.buffer) {
      this.buffer = this.imageData.data.buffer;
      this.pixels = new Uint32Array(this.buffer);
    } else if (window.ArrayBuffer) {
      this.buffer = new ArrayBuffer(this.imageData.data.length);
      this.pixels = new Uint32Array(this.buffer);
    } else {
      this.pixels = this.imageData.data;
    }
    if (this.manager.game.config.renderType === CONST.WEBGL) {
      this.refresh();
    }
    return this;
  },
  draw: function (x, y, source, update) {
    if (update === undefined) {
      update = true;
    }
    this.context.drawImage(source, x, y);
    if (update) {
      this.update();
    }
    return this;
  },
  drawFrame: function (key, frame, x, y, update) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    if (update === undefined) {
      update = true;
    }
    var textureFrame = this.manager.getFrame(key, frame);
    if (textureFrame) {
      var cd = textureFrame.canvasData;
      var width = textureFrame.cutWidth;
      var height = textureFrame.cutHeight;
      var res = textureFrame.source.resolution;
      this.context.drawImage(
        textureFrame.source.image,
        cd.x,
        cd.y,
        width,
        height,
        x,
        y,
        width / res,
        height / res,
      );
      if (update) {
        this.update();
      }
    }
    return this;
  },
  setPixel: function (x, y, red, green, blue, alpha) {
    if (alpha === undefined) {
      alpha = 255;
    }
    x = Math.abs(Math.floor(x));
    y = Math.abs(Math.floor(y));
    var index = this.getIndex(x, y);
    if (index > -1) {
      var imageData = this.context.getImageData(x, y, 1, 1);
      imageData.data[0] = red;
      imageData.data[1] = green;
      imageData.data[2] = blue;
      imageData.data[3] = alpha;
      this.context.putImageData(imageData, x, y);
    }
    return this;
  },
  putData: function (imageData, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
    if (dirtyX === undefined) {
      dirtyX = 0;
    }
    if (dirtyY === undefined) {
      dirtyY = 0;
    }
    if (dirtyWidth === undefined) {
      dirtyWidth = imageData.width;
    }
    if (dirtyHeight === undefined) {
      dirtyHeight = imageData.height;
    }
    this.context.putImageData(
      imageData,
      x,
      y,
      dirtyX,
      dirtyY,
      dirtyWidth,
      dirtyHeight,
    );
    return this;
  },
  getData: function (x, y, width, height) {
    x = Clamp(Math.floor(x), 0, this.width - 1);
    y = Clamp(Math.floor(y), 0, this.height - 1);
    width = Clamp(width, 1, this.width - x);
    height = Clamp(height, 1, this.height - y);
    var imageData = this.context.getImageData(x, y, width, height);
    return imageData;
  },
  getPixel: function (x, y, out) {
    if (!out) {
      out = new Color();
    }
    var index = this.getIndex(x, y);
    if (index > -1) {
      var data = this.data;
      var r = data[index + 0];
      var g = data[index + 1];
      var b = data[index + 2];
      var a = data[index + 3];
      out.setTo(r, g, b, a);
    }
    return out;
  },
  getPixels: function (x, y, width, height) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    if (width === undefined) {
      width = this.width;
    }
    if (height === undefined) {
      height = width;
    }
    x = Math.abs(Math.round(x));
    y = Math.abs(Math.round(y));
    var left = Clamp(x, 0, this.width);
    var right = Clamp(x + width, 0, this.width);
    var top = Clamp(y, 0, this.height);
    var bottom = Clamp(y + height, 0, this.height);
    var pixel = new Color();
    var out = [];
    for (var py = top; py < bottom; py++) {
      var row = [];
      for (var px = left; px < right; px++) {
        pixel = this.getPixel(px, py, pixel);
        row.push({ x: px, y: py, color: pixel.color, alpha: pixel.alphaGL });
      }
      out.push(row);
    }
    return out;
  },
  getIndex: function (x, y) {
    x = Math.abs(Math.round(x));
    y = Math.abs(Math.round(y));
    if (x < this.width && y < this.height) {
      return (x + y * this.width) * 4;
    } else {
      return -1;
    }
  },
  refresh: function () {
    this._source.update();
    return this;
  },
  getCanvas: function () {
    return this.canvas;
  },
  getContext: function () {
    return this.context;
  },
  clear: function (x, y, width, height, update) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    if (width === undefined) {
      width = this.width;
    }
    if (height === undefined) {
      height = this.height;
    }
    if (update === undefined) {
      update = true;
    }
    this.context.clearRect(x, y, width, height);
    if (update) {
      this.update();
    }
    return this;
  },
  setSize: function (width, height) {
    if (height === undefined) {
      height = width;
    }
    if (width !== this.width || height !== this.height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this._source.width = width;
      this._source.height = height;
      this._source.isPowerOf2 = IsSizePowerOfTwo(width, height);
      this.frames['__BASE'].setSize(width, height, 0, 0);
      this.width = width;
      this.height = height;
      this.refresh();
    }
    return this;
  },
  destroy: function () {
    Texture.prototype.destroy.call(this);
    this._source = null;
    this.canvas = null;
    this.context = null;
    this.imageData = null;
    this.data = null;
    this.pixels = null;
    this.buffer = null;
  },
});
module.exports = CanvasTexture;
