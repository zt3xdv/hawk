import MapObject from './MapObject.js';

export default class RoadLamp extends MapObject {
  static texture = "props";
    static types = [
      {
        name: '1',
        uvStartPx: { u: 391, v: 1676 },
        widthPx: 64,
        heightPx: 84,
        zoffset: 9,
        collision: { startx: 0, starty: 74, width: 17, height: 10 }
      },
      {
        name: '2',
        uvStartPx: { u: 461, v: 1676 },
        widthPx: 57,
        heightPx: 84,
        zoffset: 9,
        collision: { startx: 28, starty: 74, width: 17, height: 10 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const lamp = {
      uvStartPx: { u: 491, v: 1640 },
      widthPx: 9,
      heightPx: 17,
    };
    
    const textureKey = RoadLamp.texture;

    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(RoadLamp.types.length);
    const type = RoadLamp.types[index];

    super(scene, x, y, textureKey, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
    
    const cache = MapObject.textureCache;
    const uvKey = `${textureKey}|${lamp.uvStartPx.u},${lamp.uvStartPx.v}|${lamp.widthPx}x${lamp.heightPx}`;
    let cached = cache.get(uvKey);

    if (!cached) {
      const baseSource = scene.textures.get(textureKey).getSourceImage();
      const newKey = `crop-${textureKey}-${lamp.uvStartPx.u}-${lamp.uvStartPx.v}-${lamp.widthPx}x${lamp.heightPx}`;
      if (!scene.textures.exists(newKey)) {
        scene.textures.createCanvas(newKey, lamp.widthPx, lamp.heightPx);
        const canvasTexture = scene.textures.get(newKey);
        const ctx = canvasTexture.getSourceImage().getContext('2d');
        ctx.drawImage(
          baseSource,
          lamp.uvStartPx.u, lamp.uvStartPx.v,
          lamp.widthPx, lamp.heightPx,
          0, 0,
          lamp.widthPx, lamp.heightPx
        );
        canvasTexture.refresh();
      }
      cached = { key: newKey, refCount: 1 };
      cache.set(uvKey, cached);
    } else {
      cached.refCount++;
    }

    this.__cacheKey = uvKey;
    this.__textureKey = cached.key;
    
    this.lightXOffset = typeNum == 0 ? 35 : 1;
    this.lightYOffset = 22;

    this.lampImage = scene.add.image(x + this.lightXOffset, y + this.lightYOffset, this.__textureKey)
      .setOrigin(0, 0)
      .setDepth(y - 1);
      
    this.light = scene.lightManager.addLight(x + this.lightXOffset, y + this.lightYOffset, 150, 0xffffff, 0.9)
  }
  
  update(time, delta) {
    super.update(time, delta);
    
    this.lampImage.setDepth(this.image.y + this.height - this.zoffset);
  }
  
  setPosition(x, y) {
    super.setPosition(x, y);
    
    this.lampImage.setPosition(x + this.lightXOffset, y + this.lightYOffset);
    this.lampImage.setDepth(y - 1);
    
    this.light.x = x + this.lightXOffset + 4;
    this.light.y = y + this.lightYOffset + 8;
  }
  
  destroy() {
    super.destroy();
    
    if (this.lampImage.body) {
      this.scene.physics.world.disableBody(this.lampImage.body);
    }
    this.lampImage.destroy();
    
    this.scene.lightManager.removeLightObj(this.light);
  }
}
