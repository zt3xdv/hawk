var Class = require('../utils/Class');
var Clamp = require('../math/Clamp');
var Extend = require('../utils/object/Extend');
var Frame = new Class({
  initialize: function Frame(texture, name, sourceIndex, x, y, width, height) {
    this.texture = texture;
    this.name = name;
    this.source = texture.source[sourceIndex];
    this.sourceIndex = sourceIndex;
    this.cutX;
    this.cutY;
    this.cutWidth;
    this.cutHeight;
    this.x = 0;
    this.y = 0;
    this.width;
    this.height;
    this.halfWidth;
    this.halfHeight;
    this.centerX;
    this.centerY;
    this.pivotX = 0;
    this.pivotY = 0;
    this.customPivot = false;
    this.rotated = false;
    this.autoRound = -1;
    this.customData = {};
    this.u0 = 0;
    this.v0 = 0;
    this.u1 = 0;
    this.v1 = 0;
    this.data = {
      cut: { x: 0, y: 0, w: 0, h: 0, r: 0, b: 0 },
      trim: false,
      sourceSize: { w: 0, h: 0 },
      spriteSourceSize: { x: 0, y: 0, w: 0, h: 0, r: 0, b: 0 },
      radius: 0,
      drawImage: { x: 0, y: 0, width: 0, height: 0 },
      is3Slice: false,
      scale9: false,
      scale9Borders: { x: 0, y: 0, w: 0, h: 0 },
    };
    this.setSize(width, height, x, y);
  },
  setCutPosition: function (x, y) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    this.cutX = x;
    this.cutY = y;
    return this.updateUVs();
  },
  setCutSize: function (width, height) {
    this.cutWidth = width;
    this.cutHeight = height;
    return this.updateUVs();
  },
  setSize: function (width, height, x, y) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    this.setCutPosition(x, y);
    this.setCutSize(width, height);
    this.width = width;
    this.height = height;
    this.halfWidth = Math.floor(width * 0.5);
    this.halfHeight = Math.floor(height * 0.5);
    this.centerX = Math.floor(width / 2);
    this.centerY = Math.floor(height / 2);
    var data = this.data;
    var cut = data.cut;
    cut.x = x;
    cut.y = y;
    cut.w = width;
    cut.h = height;
    cut.r = x + width;
    cut.b = y + height;
    data.sourceSize.w = width;
    data.sourceSize.h = height;
    data.spriteSourceSize.w = width;
    data.spriteSourceSize.h = height;
    data.radius = 0.5 * Math.sqrt(width * width + height * height);
    var drawImage = data.drawImage;
    drawImage.x = x;
    drawImage.y = y;
    drawImage.width = width;
    drawImage.height = height;
    return this.updateUVs();
  },
  setTrim: function (
    actualWidth,
    actualHeight,
    destX,
    destY,
    destWidth,
    destHeight,
  ) {
    var data = this.data;
    var ss = data.spriteSourceSize;
    data.trim = true;
    data.sourceSize.w = actualWidth;
    data.sourceSize.h = actualHeight;
    ss.x = destX;
    ss.y = destY;
    ss.w = destWidth;
    ss.h = destHeight;
    ss.r = destX + destWidth;
    ss.b = destY + destHeight;
    this.x = destX;
    this.y = destY;
    this.width = destWidth;
    this.height = destHeight;
    this.halfWidth = destWidth * 0.5;
    this.halfHeight = destHeight * 0.5;
    this.centerX = Math.floor(destWidth / 2);
    this.centerY = Math.floor(destHeight / 2);
    return this.updateUVs();
  },
  setScale9: function (x, y, width, height) {
    var data = this.data;
    data.scale9 = true;
    data.is3Slice = y === 0 && height === this.height;
    data.scale9Borders.x = x;
    data.scale9Borders.y = y;
    data.scale9Borders.w = width;
    data.scale9Borders.h = height;
    return this;
  },
  setCropUVs: function (crop, x, y, width, height, flipX, flipY) {
    var cx = this.cutX;
    var cy = this.cutY;
    var cw = this.cutWidth;
    var ch = this.cutHeight;
    var rw = this.realWidth;
    var rh = this.realHeight;
    x = Clamp(x, 0, rw);
    y = Clamp(y, 0, rh);
    width = Clamp(width, 0, rw - x);
    height = Clamp(height, 0, rh - y);
    var ox = cx + x;
    var oy = cy + y;
    var ow = width;
    var oh = height;
    var data = this.data;
    if (data.trim) {
      var ss = data.spriteSourceSize;
      width = Clamp(width, 0, ss.x + cw - x);
      height = Clamp(height, 0, ss.y + ch - y);
      var cropRight = x + width;
      var cropBottom = y + height;
      var intersects = !(
        ss.r < x ||
        ss.b < y ||
        ss.x > cropRight ||
        ss.y > cropBottom
      );
      if (intersects) {
        var ix = Math.max(ss.x, x);
        var iy = Math.max(ss.y, y);
        var iw = Math.min(ss.r, cropRight) - ix;
        var ih = Math.min(ss.b, cropBottom) - iy;
        ow = iw;
        oh = ih;
        if (flipX) {
          ox = cx + (cw - (ix - ss.x) - iw);
        } else {
          ox = cx + (ix - ss.x);
        }
        if (flipY) {
          oy = cy + (ch - (iy - ss.y) - ih);
        } else {
          oy = cy + (iy - ss.y);
        }
        x = ix;
        y = iy;
        width = iw;
        height = ih;
      } else {
        ox = 0;
        oy = 0;
        ow = 0;
        oh = 0;
      }
    } else {
      if (flipX) {
        ox = cx + (cw - x - width);
      }
      if (flipY) {
        oy = cy + (ch - y - height);
      }
    }
    var tw = this.source.width;
    var th = this.source.height;
    crop.u0 = Math.max(0, ox / tw);
    crop.v0 = Math.max(0, oy / th);
    crop.u1 = Math.min(1, (ox + ow) / tw);
    crop.v1 = Math.min(1, (oy + oh) / th);
    crop.x = x;
    crop.y = y;
    crop.cx = ox;
    crop.cy = oy;
    crop.cw = ow;
    crop.ch = oh;
    crop.width = width;
    crop.height = height;
    crop.flipX = flipX;
    crop.flipY = flipY;
    return crop;
  },
  updateCropUVs: function (crop, flipX, flipY) {
    return this.setCropUVs(
      crop,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      flipX,
      flipY,
    );
  },
  setUVs: function (width, height, u0, v0, u1, v1) {
    var cd = this.data.drawImage;
    cd.width = width;
    cd.height = height;
    this.u0 = u0;
    this.v0 = v0;
    this.u1 = u1;
    this.v1 = v1;
    return this;
  },
  updateUVs: function () {
    var cx = this.cutX;
    var cy = this.cutY;
    var cw = this.cutWidth;
    var ch = this.cutHeight;
    var cd = this.data.drawImage;
    cd.width = cw;
    cd.height = ch;
    var tw = this.source.width;
    var th = this.source.height;
    this.u0 = cx / tw;
    this.v0 = cy / th;
    this.u1 = (cx + cw) / tw;
    this.v1 = (cy + ch) / th;
    return this;
  },
  updateUVsInverted: function () {
    var tw = this.source.width;
    var th = this.source.height;
    this.u0 = (this.cutX + this.cutHeight) / tw;
    this.v0 = this.cutY / th;
    this.u1 = this.cutX / tw;
    this.v1 = (this.cutY + this.cutWidth) / th;
    return this;
  },
  clone: function () {
    var clone = new Frame(this.texture, this.name, this.sourceIndex);
    clone.cutX = this.cutX;
    clone.cutY = this.cutY;
    clone.cutWidth = this.cutWidth;
    clone.cutHeight = this.cutHeight;
    clone.x = this.x;
    clone.y = this.y;
    clone.width = this.width;
    clone.height = this.height;
    clone.halfWidth = this.halfWidth;
    clone.halfHeight = this.halfHeight;
    clone.centerX = this.centerX;
    clone.centerY = this.centerY;
    clone.rotated = this.rotated;
    clone.data = Extend(true, clone.data, this.data);
    clone.updateUVs();
    return clone;
  },
  destroy: function () {
    this.texture = null;
    this.source = null;
    this.customData = null;
    this.data = null;
  },
  glTexture: {
    get: function () {
      return this.source.glTexture;
    },
  },
  realWidth: {
    get: function () {
      return this.data.sourceSize.w;
    },
  },
  realHeight: {
    get: function () {
      return this.data.sourceSize.h;
    },
  },
  radius: {
    get: function () {
      return this.data.radius;
    },
  },
  trimmed: {
    get: function () {
      return this.data.trim;
    },
  },
  scale9: {
    get: function () {
      return this.data.scale9;
    },
  },
  is3Slice: {
    get: function () {
      return this.data.is3Slice;
    },
  },
  canvasData: {
    get: function () {
      return this.data.drawImage;
    },
  },
});
module.exports = Frame;
