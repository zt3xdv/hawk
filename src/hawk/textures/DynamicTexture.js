var BlendModes = require('../renderer/BlendModes');
var Camera = require('../cameras/2d/Camera');
var CanvasPool = require('../display/canvas/CanvasPool');
var Class = require('../utils/Class');
var CONST = require('../const');
var Frame = require('./Frame');
var GetFastValue = require('../utils/object/GetFastValue');
var PIPELINES = require('../renderer/webgl/pipelines/const');
var RenderTarget = require('../renderer/webgl/RenderTarget');
var Texture = require('./Texture');
var Utils = require('../renderer/webgl/Utils');
var DynamicTexture = new Class({
  Extends: Texture,
  initialize: function DynamicTexture(manager, key, width, height, forceEven) {
    if (width === undefined) {
      width = 256;
    }
    if (height === undefined) {
      height = 256;
    }
    if (forceEven === undefined) {
      forceEven = true;
    }
    this.type = 'DynamicTexture';
    var renderer = manager.game.renderer;
    var isCanvas = renderer && renderer.type === CONST.CANVAS;
    var source = isCanvas ? CanvasPool.create2D(this, width, height) : [this];
    Texture.call(this, manager, key, source, width, height);
    this.add('__BASE', 0, 0, 0, width, height);
    this.renderer = renderer;
    this.width = -1;
    this.height = -1;
    this.isDrawing = false;
    this.canvas = isCanvas ? source : null;
    this.context = isCanvas
      ? source.getContext('2d', { willReadFrequently: true })
      : null;
    this.dirty = false;
    this.isSpriteTexture = true;
    this._eraseMode = false;
    this.camera = new Camera(0, 0, width, height).setScene(
      manager.game.scene.systemScene,
      false,
    );
    this.renderTarget = !isCanvas
      ? new RenderTarget(
          renderer,
          width,
          height,
          1,
          0,
          false,
          false,
          true,
          false,
        )
      : null;
    this.pipeline = !isCanvas
      ? renderer.pipelines.get(PIPELINES.SINGLE_PIPELINE)
      : null;
    this.setSize(width, height, forceEven);
  },
  setSize: function (width, height, forceEven) {
    if (height === undefined) {
      height = width;
    }
    if (forceEven === undefined) {
      forceEven = true;
    }
    if (forceEven) {
      width = Math.floor(width);
      height = Math.floor(height);
      if (width % 2 !== 0) {
        width++;
      }
      if (height % 2 !== 0) {
        height++;
      }
    }
    var frame = this.get();
    var source = frame.source;
    if (width !== this.width || height !== this.height) {
      if (this.canvas) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      var renderTarget = this.renderTarget;
      if (renderTarget) {
        if (renderTarget.willResize(width, height)) {
          renderTarget.resize(width, height);
        }
        if (renderTarget.texture !== source.glTexture) {
          this.renderer.deleteTexture(source.glTexture);
        }
        this.setFromRenderTarget();
      }
      this.camera.setSize(width, height);
      source.width = width;
      source.height = height;
      frame.setSize(width, height);
      this.width = width;
      this.height = height;
    } else {
      var baseFrame = this.getSourceImage();
      if (frame.cutX + width > baseFrame.width) {
        width = baseFrame.width - frame.cutX;
      }
      if (frame.cutY + height > baseFrame.height) {
        height = baseFrame.height - frame.cutY;
      }
      frame.setSize(width, height, frame.cutX, frame.cutY);
    }
    return this;
  },
  setFromRenderTarget: function () {
    var frame = this.get();
    var source = frame.source;
    var renderTarget = this.renderTarget;
    source.isRenderTexture = true;
    source.isGLTexture = true;
    source.glTexture = renderTarget.texture;
    return this;
  },
  setIsSpriteTexture: function (value) {
    this.isSpriteTexture = value;
    return this;
  },
  fill: function (rgb, alpha, x, y, width, height) {
    var camera = this.camera;
    var renderer = this.renderer;
    if (alpha === undefined) {
      alpha = 1;
    }
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
    var r = (rgb >> 16) & 0xff;
    var g = (rgb >> 8) & 0xff;
    var b = rgb & 0xff;
    var renderTarget = this.renderTarget;
    camera.preRender();
    if (renderTarget) {
      renderTarget.bind(true);
      var pipeline = this.pipeline.manager.set(this.pipeline);
      var sx = renderer.width / renderTarget.width;
      var sy = renderer.height / renderTarget.height;
      var ty = renderTarget.height - (y + height);
      pipeline.drawFillRect(
        x * sx,
        ty * sy,
        width * sx,
        height * sy,
        Utils.getTintFromFloats(b / 255, g / 255, r / 255, 1),
        alpha,
      );
      renderTarget.unbind(true);
    } else {
      var ctx = this.context;
      renderer.setContext(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
      ctx.fillRect(x, y, width, height);
      renderer.setContext();
    }
    this.dirty = true;
    return this;
  },
  clear: function (x, y, width, height) {
    if (this.dirty) {
      var ctx = this.context;
      var renderTarget = this.renderTarget;
      if (renderTarget) {
        renderTarget.clear(x, y, width, height);
      } else if (ctx) {
        if (
          x !== undefined &&
          y !== undefined &&
          width !== undefined &&
          height !== undefined
        ) {
          ctx.clearRect(x, y, width, height);
        } else {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, this.width, this.height);
          ctx.restore();
        }
      }
      this.dirty = false;
    }
    return this;
  },
  stamp: function (key, frame, x, y, config) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    var alpha = GetFastValue(config, 'alpha', 1);
    var tint = GetFastValue(config, 'tint', 0xffffff);
    var angle = GetFastValue(config, 'angle', 0);
    var rotation = GetFastValue(config, 'rotation', 0);
    var scale = GetFastValue(config, 'scale', 1);
    var scaleX = GetFastValue(config, 'scaleX', scale);
    var scaleY = GetFastValue(config, 'scaleY', scale);
    var originX = GetFastValue(config, 'originX', 0.5);
    var originY = GetFastValue(config, 'originY', 0.5);
    var blendMode = GetFastValue(config, 'blendMode', 0);
    var erase = GetFastValue(config, 'erase', false);
    var skipBatch = GetFastValue(config, 'skipBatch', false);
    var stamp = this.manager.resetStamp(alpha, tint);
    stamp.setAngle(0);
    if (angle !== 0) {
      stamp.setAngle(angle);
    } else if (rotation !== 0) {
      stamp.setRotation(rotation);
    }
    stamp.setScale(scaleX, scaleY);
    stamp.setTexture(key, frame);
    stamp.setOrigin(originX, originY);
    stamp.setBlendMode(blendMode);
    if (erase) {
      this._eraseMode = true;
    }
    if (!skipBatch) {
      this.draw(stamp, x, y);
    } else {
      this.batchGameObject(stamp, x, y);
    }
    if (erase) {
      this._eraseMode = false;
    }
    return this;
  },
  erase: function (entries, x, y) {
    this._eraseMode = true;
    this.draw(entries, x, y);
    this._eraseMode = false;
    return this;
  },
  draw: function (entries, x, y, alpha, tint) {
    this.beginDraw();
    this.batchDraw(entries, x, y, alpha, tint);
    this.endDraw();
    return this;
  },
  drawFrame: function (key, frame, x, y, alpha, tint) {
    this.beginDraw();
    this.batchDrawFrame(key, frame, x, y, alpha, tint);
    this.endDraw();
    return this;
  },
  repeat: function (key, frame, x, y, width, height, alpha, tint, skipBatch) {
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
    if (alpha === undefined) {
      alpha = 1;
    }
    if (tint === undefined) {
      tint = 0xffffff;
    }
    if (skipBatch === undefined) {
      skipBatch = false;
    }
    if (key instanceof Frame) {
      frame = key;
    } else {
      frame = this.manager.getFrame(key, frame);
    }
    if (!frame) {
      return this;
    }
    var stamp = this.manager.resetStamp(alpha, tint);
    stamp.setFrame(frame);
    stamp.setOrigin(0);
    var frameWidth = frame.width;
    var frameHeight = frame.height;
    width = Math.floor(width);
    height = Math.floor(height);
    var hmax = Math.ceil(width / frameWidth);
    var vmax = Math.ceil(height / frameHeight);
    var hdiff = hmax * frameWidth - width;
    var vdiff = vmax * frameHeight - height;
    if (hdiff > 0) {
      hdiff = frameWidth - hdiff;
    }
    if (vdiff > 0) {
      vdiff = frameHeight - vdiff;
    }
    if (x < 0) {
      hmax += Math.ceil(Math.abs(x) / frameWidth);
    }
    if (y < 0) {
      vmax += Math.ceil(Math.abs(y) / frameHeight);
    }
    var dx = x;
    var dy = y;
    var useCrop = false;
    var cropRect = this.manager.stampCrop.setTo(0, 0, frameWidth, frameHeight);
    if (!skipBatch) {
      this.beginDraw();
    }
    for (var ty = 0; ty < vmax; ty++) {
      if (dy + frameHeight < 0) {
        dy += frameHeight;
        continue;
      }
      for (var tx = 0; tx < hmax; tx++) {
        useCrop = false;
        if (dx + frameWidth < 0) {
          dx += frameWidth;
          continue;
        } else if (dx < 0) {
          useCrop = true;
          cropRect.width = frameWidth + dx;
          cropRect.x = frameWidth - cropRect.width;
        }
        if (dy < 0) {
          useCrop = true;
          cropRect.height = frameHeight + dy;
          cropRect.y = frameHeight - cropRect.height;
        }
        if (hdiff > 0 && tx === hmax - 1) {
          useCrop = true;
          cropRect.width = hdiff;
        }
        if (vdiff > 0 && ty === vmax - 1) {
          useCrop = true;
          cropRect.height = vdiff;
        }
        if (useCrop) {
          stamp.setCrop(cropRect);
        }
        this.batchGameObject(stamp, dx, dy);
        stamp.isCropped = false;
        cropRect.setTo(0, 0, frameWidth, frameHeight);
        dx += frameWidth;
      }
      dx = x;
      dy += frameHeight;
    }
    if (!skipBatch) {
      this.endDraw();
    }
    return this;
  },
  beginDraw: function () {
    if (!this.isDrawing) {
      var camera = this.camera;
      var renderer = this.renderer;
      var renderTarget = this.renderTarget;
      camera.preRender();
      if (renderTarget) {
        renderer.beginCapture(renderTarget.width, renderTarget.height);
      } else {
        renderer.setContext(this.context);
      }
      this.isDrawing = true;
    }
    return this;
  },
  batchDraw: function (entries, x, y, alpha, tint) {
    if (!Array.isArray(entries)) {
      entries = [entries];
    }
    this.batchList(entries, x, y, alpha, tint);
    return this;
  },
  batchDrawFrame: function (key, frame, x, y, alpha, tint) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    if (alpha === undefined) {
      alpha = 1;
    }
    if (tint === undefined) {
      tint = 0xffffff;
    }
    var textureFrame = this.manager.getFrame(key, frame);
    if (textureFrame) {
      if (this.renderTarget) {
        this.pipeline.batchTextureFrame(
          textureFrame,
          x,
          y,
          tint,
          alpha,
          this.camera.matrix,
          null,
        );
      } else {
        this.batchTextureFrame(textureFrame, x, y, alpha, tint);
      }
    }
    return this;
  },
  endDraw: function (erase) {
    if (erase === undefined) {
      erase = this._eraseMode;
    }
    if (this.isDrawing) {
      var renderer = this.renderer;
      var renderTarget = this.renderTarget;
      if (renderTarget) {
        var canvasTarget = renderer.endCapture();
        var util = renderer.pipelines.setUtility();
        util.blitFrame(
          canvasTarget,
          renderTarget,
          1,
          false,
          false,
          erase,
          this.isSpriteTexture,
        );
        renderer.resetScissor();
        renderer.resetViewport();
      } else {
        renderer.setContext();
      }
      this.dirty = true;
      this.isDrawing = false;
    }
    return this;
  },
  batchList: function (children, x, y, alpha, tint) {
    var len = children.length;
    if (len === 0) {
      return;
    }
    for (var i = 0; i < len; i++) {
      var entry = children[i];
      if (!entry || entry === this) {
        continue;
      }
      if (entry.renderWebGL || entry.renderCanvas) {
        this.batchGameObject(entry, x, y);
      } else if (entry.isParent || entry.list) {
        this.batchGroup(entry.getChildren(), x, y);
      } else if (typeof entry === 'string') {
        this.batchTextureFrameKey(entry, null, x, y, alpha, tint);
      } else if (entry instanceof Frame) {
        this.batchTextureFrame(entry, x, y, alpha, tint);
      } else if (Array.isArray(entry)) {
        this.batchList(entry, x, y, alpha, tint);
      }
    }
  },
  batchGroup: function (children, x, y) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    for (var i = 0; i < children.length; i++) {
      var entry = children[i];
      if (entry.willRender(this.camera)) {
        this.batchGameObject(entry, entry.x + x, entry.y + y);
      }
    }
  },
  batchGameObject: function (gameObject, x, y) {
    if (x === undefined) {
      x = gameObject.x;
    }
    if (y === undefined) {
      y = gameObject.y;
    }
    var prevX = gameObject.x;
    var prevY = gameObject.y;
    var camera = this.camera;
    var renderer = this.renderer;
    var eraseMode = this._eraseMode;
    var mask = gameObject.mask;
    gameObject.setPosition(x, y);
    if (this.canvas) {
      if (eraseMode) {
        var blendMode = gameObject.blendMode;
        gameObject.blendMode = BlendModes.ERASE;
      }
      if (mask) {
        mask.preRenderCanvas(renderer, gameObject, camera);
      }
      gameObject.renderCanvas(renderer, gameObject, camera, null);
      if (mask) {
        mask.postRenderCanvas(renderer, gameObject, camera);
      }
      if (eraseMode) {
        gameObject.blendMode = blendMode;
      }
    } else if (renderer) {
      if (mask) {
        mask.preRenderWebGL(renderer, gameObject, camera);
      }
      if (!eraseMode) {
        renderer.setBlendMode(gameObject.blendMode);
      }
      gameObject.renderWebGL(renderer, gameObject, camera);
      if (mask) {
        mask.postRenderWebGL(renderer, camera, this.renderTarget);
      }
    }
    gameObject.setPosition(prevX, prevY);
  },
  batchTextureFrameKey: function (key, frame, x, y, alpha, tint) {
    var textureFrame = this.manager.getFrame(key, frame);
    if (textureFrame) {
      this.batchTextureFrame(textureFrame, x, y, alpha, tint);
    }
  },
  batchTextureFrame: function (textureFrame, x, y, alpha, tint) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    if (alpha === undefined) {
      alpha = 1;
    }
    if (tint === undefined) {
      tint = 0xffffff;
    }
    var matrix = this.camera.matrix;
    var renderTarget = this.renderTarget;
    if (renderTarget) {
      this.pipeline.batchTextureFrame(
        textureFrame,
        x,
        y,
        tint,
        alpha,
        matrix,
        null,
      );
    } else {
      var ctx = this.context;
      var cd = textureFrame.canvasData;
      var source = textureFrame.source.image;
      ctx.save();
      ctx.globalCompositeOperation = this._eraseMode
        ? 'destination-out'
        : 'source-over';
      ctx.globalAlpha = alpha;
      matrix.setToContext(ctx);
      if (cd.width > 0 && cd.height > 0) {
        ctx.drawImage(
          source,
          cd.x,
          cd.y,
          cd.width,
          cd.height,
          x,
          y,
          cd.width,
          cd.height,
        );
      }
      ctx.restore();
    }
  },
  snapshotArea: function (x, y, width, height, callback, type, encoderOptions) {
    if (this.renderTarget) {
      this.renderer.snapshotFramebuffer(
        this.renderTarget.framebuffer,
        this.width,
        this.height,
        callback,
        false,
        x,
        y,
        width,
        height,
        type,
        encoderOptions,
      );
    } else {
      this.renderer.snapshotCanvas(
        this.canvas,
        callback,
        false,
        x,
        y,
        width,
        height,
        type,
        encoderOptions,
      );
    }
    return this;
  },
  snapshot: function (callback, type, encoderOptions) {
    return this.snapshotArea(
      0,
      0,
      this.width,
      this.height,
      callback,
      type,
      encoderOptions,
    );
  },
  snapshotPixel: function (x, y, callback) {
    return this.snapshotArea(x, y, 1, 1, callback, 'pixel');
  },
  getWebGLTexture: function () {
    if (this.renderTarget) {
      return this.renderTarget.texture;
    }
  },
  renderWebGL: function (renderer, src, camera, parentMatrix) {
    var stamp = this.manager.resetStamp();
    stamp.setTexture(this);
    stamp.setOrigin(0);
    stamp.renderWebGL(renderer, stamp, camera, parentMatrix);
  },
  renderCanvas: function () {},
  destroy: function () {
    var stamp = this.manager.stamp;
    if (stamp && stamp.texture === this) {
      this.manager.resetStamp();
    }
    Texture.prototype.destroy.call(this);
    CanvasPool.remove(this.canvas);
    if (this.renderTarget) {
      this.renderTarget.destroy();
    }
    this.camera.destroy();
    this.canvas = null;
    this.context = null;
    this.renderer = null;
  },
});
module.exports = DynamicTexture;
