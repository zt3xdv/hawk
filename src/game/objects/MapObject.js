import HawkEngine from '../../../dist/engine/main.js';
import Editable from '../utils/Editable.js';

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

    const cache = MapObject.textureCache;
    const uvKey = `${textureKey}|${uvStartPx.u},${uvStartPx.v}|${widthPx}x${heightPx}`;
    let cached = cache.get(uvKey);

    if (!cached) {
      const baseSource = scene.textures.get(textureKey).getSourceImage();
      const newKey = `crop-${textureKey}-${uvStartPx.u}-${uvStartPx.v}-${widthPx}x${heightPx}`;
      if (!scene.textures.exists(newKey)) {
        scene.textures.createCanvas(newKey, widthPx, heightPx);
        const canvasTexture = scene.textures.get(newKey);
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
      cached = { key: newKey, refCount: 1 };
      cache.set(uvKey, cached);
    } else {
      cached.refCount++;
    }

    this._cacheKey = uvKey;
    this._textureKey = cached.key;

    this.image = scene.add.image(x, y, this._textureKey)
      .setOrigin(0, 0)
      .setDepth(y);

    scene.physics.add.existing(this.image);
    this.image.body
      .setSize(0, 0)
      .setBounce(1, 1)
      .setCollideWorldBounds(true)
      .setImmovable(true);

    this.image.setData('id', this.id);
    if (scene.dev) Editable.setEditable(this, this.scene);
  }

  update(time, delta) {
    this.image.setDepth(this.image.y + this.height - this.zoffset);
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    
    this.image.setPosition(x, y);
    this.image.setDepth(this.image.y + this.height - this.zoffset);
  }

  destroy() {
    if (this.image.body) {
      this.scene.physics.world.disableBody(this.image.body);
    }
    this.image.destroy();
  }
}
