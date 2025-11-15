var Class = require('../utils/Class');
var Frame = require('./Frame');
var TextureSource = require('./TextureSource');
var TEXTURE_MISSING_ERROR = 'Texture "%s" has no frame "%s"';
var Texture = new Class({
  initialize: function Texture(manager, key, source, width, height) {
    if (!Array.isArray(source)) {
      source = [source];
    }
    this.manager = manager;
    this.key = key;
    this.source = [];
    this.dataSource = [];
    this.frames = {};
    this.customData = {};
    this.firstFrame = '__BASE';
    this.frameTotal = 0;
    for (var i = 0; i < source.length; i++) {
      this.source.push(new TextureSource(this, source[i], width, height));
    }
  },
  add: function (name, sourceIndex, x, y, width, height) {
    if (this.has(name)) {
      return null;
    }
    var frame = new Frame(this, name, sourceIndex, x, y, width, height);
    this.frames[name] = frame;
    if (this.firstFrame === '__BASE') {
      this.firstFrame = name;
    }
    this.frameTotal++;
    return frame;
  },
  remove: function (name) {
    if (this.has(name)) {
      var frame = this.get(name);
      frame.destroy();
      delete this.frames[name];
      return true;
    }
    return false;
  },
  has: function (name) {
    return this.frames.hasOwnProperty(name);
  },
  get: function (name) {
    if (!name) {
      name = this.firstFrame;
    }
    var frame = this.frames[name];
    if (!frame) {
      console.warn(TEXTURE_MISSING_ERROR, this.key, name);
      frame = this.frames[this.firstFrame];
    }
    return frame;
  },
  getTextureSourceIndex: function (source) {
    for (var i = 0; i < this.source.length; i++) {
      if (this.source[i] === source) {
        return i;
      }
    }
    return -1;
  },
  getFramesFromTextureSource: function (sourceIndex, includeBase) {
    if (includeBase === undefined) {
      includeBase = false;
    }
    var out = [];
    for (var frameName in this.frames) {
      if (frameName === '__BASE' && !includeBase) {
        continue;
      }
      var frame = this.frames[frameName];
      if (frame.sourceIndex === sourceIndex) {
        out.push(frame);
      }
    }
    return out;
  },
  getFrameBounds: function (sourceIndex) {
    if (sourceIndex === undefined) {
      sourceIndex = 0;
    }
    var frames = this.getFramesFromTextureSource(sourceIndex, true);
    var baseFrame = frames[0];
    var minX = baseFrame.cutX;
    var minY = baseFrame.cutY;
    var maxX = baseFrame.cutX + baseFrame.cutWidth;
    var maxY = baseFrame.cutY + baseFrame.cutHeight;
    for (var i = 1; i < frames.length; i++) {
      var frame = frames[i];
      if (frame.cutX < minX) {
        minX = frame.cutX;
      }
      if (frame.cutY < minY) {
        minY = frame.cutY;
      }
      if (frame.cutX + frame.cutWidth > maxX) {
        maxX = frame.cutX + frame.cutWidth;
      }
      if (frame.cutY + frame.cutHeight > maxY) {
        maxY = frame.cutY + frame.cutHeight;
      }
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  },
  getFrameNames: function (includeBase) {
    if (includeBase === undefined) {
      includeBase = false;
    }
    var out = Object.keys(this.frames);
    if (!includeBase) {
      var idx = out.indexOf('__BASE');
      if (idx !== -1) {
        out.splice(idx, 1);
      }
    }
    return out;
  },
  getSourceImage: function (name) {
    if (name === undefined || name === null || this.frameTotal === 1) {
      name = '__BASE';
    }
    var frame = this.frames[name];
    if (frame) {
      return frame.source.image;
    } else {
      console.warn(TEXTURE_MISSING_ERROR, this.key, name);
      return this.frames['__BASE'].source.image;
    }
  },
  getDataSourceImage: function (name) {
    if (name === undefined || name === null || this.frameTotal === 1) {
      name = '__BASE';
    }
    var frame = this.frames[name];
    var idx;
    if (!frame) {
      console.warn(TEXTURE_MISSING_ERROR, this.key, name);
      idx = this.frames['__BASE'].sourceIndex;
    } else {
      idx = frame.sourceIndex;
    }
    return this.dataSource[idx].image;
  },
  setDataSource: function (data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    for (var i = 0; i < data.length; i++) {
      var source = this.source[i];
      this.dataSource.push(
        new TextureSource(this, data[i], source.width, source.height),
      );
    }
  },
  setFilter: function (filterMode) {
    var i;
    for (i = 0; i < this.source.length; i++) {
      this.source[i].setFilter(filterMode);
    }
    for (i = 0; i < this.dataSource.length; i++) {
      this.dataSource[i].setFilter(filterMode);
    }
  },
  destroy: function () {
    var i;
    var source = this.source;
    var dataSource = this.dataSource;
    for (i = 0; i < source.length; i++) {
      if (source[i]) {
        source[i].destroy();
      }
    }
    for (i = 0; i < dataSource.length; i++) {
      if (dataSource[i]) {
        dataSource[i].destroy();
      }
    }
    for (var frameName in this.frames) {
      var frame = this.frames[frameName];
      if (frame) {
        frame.destroy();
      }
    }
    this.source = [];
    this.dataSource = [];
    this.frames = {};
    this.manager.removeKey(this.key);
    this.manager = null;
  },
});
module.exports = Texture;
