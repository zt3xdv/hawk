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
      collision: { startx: 0, starty: 74, width: 17, height: 10 },
      lampOffset: { x: 35, y: 22 },
      lightOffset: { x: 39, y: 30 }
    },
    {
      name: '2',
      uvStartPx: { u: 461, v: 1676 },
      widthPx: 57,
      heightPx: 84,
      zoffset: 9,
      collision: { startx: 28, starty: 74, width: 17, height: 10 },
      lampOffset: { x: 1, y: 22 },
      lightOffset: { x: 5, y: 30 }
    }
  ];

  static lampUV = {
    uvStartPx: { u: 491, v: 1640 },
    widthPx: 9,
    heightPx: 17
  };
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum !== -1 ? typeNum : scene.random.getNextInt(RoadLamp.types.length);
    const type = RoadLamp.types[index];

    super(scene, x, y, RoadLamp.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;
    this.typeIndex = index;
    
    this._setupCollision(type.collision);
    this._setupLamp(x, y, type.lampOffset);
    this._setupLight(x, y, type.lightOffset);
  }

  _setupCollision(collision) {
    const { startx, starty, width, height } = collision;
    this.image.body.setSize(width, height).setOffset(startx, starty);
  }

  _setupLamp(x, y, offset) {
    const lampTexture = this._getCachedTexture(
      RoadLamp.texture, 
      RoadLamp.lampUV.uvStartPx, 
      RoadLamp.lampUV.widthPx, 
      RoadLamp.lampUV.heightPx
    );

    this.lampImage = this.scene.add.image(
      x + offset.x, 
      y + offset.y, 
      lampTexture
    )
      .setOrigin(0, 0)
      .setDepth(y - 1);
  }

  _setupLight(x, y, offset) {
    this.light = this.scene.lightManager.addLight(
      x + offset.x, 
      y + offset.y, 
      200, 
      0xFFF4D0, 
      0.93, 
      1.15
    );
  }
  
  update(time, delta) {
    super.update(time, delta);
    
    if (this.lampImage) {
      this.lampImage.setDepth(this._calculateDepth(this.image.y));
    }
  }
  
  setPosition(x, y) {
    super.setPosition(x, y);
    
    const type = RoadLamp.types[this.typeIndex];
    
    if (this.lampImage) {
      this.lampImage.setPosition(x + type.lampOffset.x, y + type.lampOffset.y);
      this.lampImage.setDepth(this._calculateDepth(y));
    }
    
    if (this.light) {
      this.light.x = x + type.lightOffset.x;
      this.light.y = y + type.lightOffset.y;
    }
  }
  
  destroy() {
    if (this.lampImage) {
      if (this.lampImage.body) {
        this.scene.physics.world.disableBody(this.lampImage.body);
      }
      this.lampImage.destroy();
      this.lampImage = null;
    }
    
    if (this.light) {
      this.scene.lightManager.removeLightObj(this.light);
      this.light = null;
    }
    
    super.destroy();
  }
}
