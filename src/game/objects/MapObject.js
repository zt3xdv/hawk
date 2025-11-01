import HawkEngine from '../../../dist/engine/main.js';

export default class MapObject {
  static _nextId = 1;
  static textureCache = new Map();

  constructor(scene, x, y, textureKey, uvStartPx, widthPx, heightPx, zoffset = 0) {
    this.id = MapObject._nextId++;
    this.scene = scene;
    this.width = widthPx;
    this.height = heightPx;
    this.zoffset = zoffset;
    this.x = x;
    this.y = y;
    this.isOverlapping = false;

    this._textureKey = this._getCachedTexture(textureKey, uvStartPx, widthPx, heightPx);

    this.image = scene.add.image(x, y, this._textureKey)
      .setOrigin(0, 0)
      .setDepth(this._calculateDepth(y));

    this._setupPhysics();
    this.image.setData('id', this.id);
    this.image.setData('mapObject', this);
  }

  _getCachedTexture(textureKey, uvStartPx, widthPx, heightPx) {
    const cache = MapObject.textureCache;
    const uvKey = `${textureKey}|${uvStartPx.u},${uvStartPx.v}|${widthPx}x${heightPx}`;
    let cached = cache.get(uvKey);

    if (!cached) {
      const newKey = `crop-${textureKey}-${uvStartPx.u}-${uvStartPx.v}-${widthPx}x${heightPx}`;
      
      if (!this.scene.textures.exists(newKey)) {
        this._createCroppedTexture(textureKey, uvStartPx, widthPx, heightPx, newKey);
      }
      
      cached = { key: newKey, refCount: 1 };
      cache.set(uvKey, cached);
    } else {
      cached.refCount++;
    }

    this._cacheKey = uvKey;
    return cached.key;
  }

  _createCroppedTexture(textureKey, uvStartPx, widthPx, heightPx, newKey) {
    const baseSource = this.scene.textures.get(textureKey).getSourceImage();
    this.scene.textures.createCanvas(newKey, widthPx, heightPx);
    const canvasTexture = this.scene.textures.get(newKey);
    const ctx = canvasTexture.getSourceImage().getContext('2d');
    
    ctx.drawImage(
      baseSource,
      uvStartPx.u, uvStartPx.v,
      widthPx, heightPx,
      0, 0,
      widthPx, heightPx
    );
    
    canvasTexture.refresh();
  }

  _setupPhysics() {
    this.scene.physics.add.existing(this.image);
    this.image.body
      .setSize(0, 0)
      .setBounce(0, 0)
      .setCollideWorldBounds(true)
      .setImmovable(true);
  }

  _calculateDepth(y) {
    return y + this.height - this.zoffset;
  }

  update(time, delta) {
    this.image.setDepth(this._calculateDepth(this.image.y));
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.image.setPosition(x, y);
    this.image.setDepth(this._calculateDepth(y));
  }

  destroy() {
    if (this._cacheKey) {
      const cached = MapObject.textureCache.get(this._cacheKey);
      if (cached) {
        cached.refCount--;
        if (cached.refCount <= 0) {
          MapObject.textureCache.delete(this._cacheKey);
          if (this.scene.textures.exists(cached.key)) {
            this.scene.textures.remove(cached.key);
          }
        }
      }
    }

    if (this.image) {
      if (this.image.body) {
        this.scene.physics.world.disableBody(this.image.body);
      }
      this.image.destroy();
      this.image = null;
    }
  }
}
