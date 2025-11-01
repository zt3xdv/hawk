import MapObject from './MapObject.js';

export default class Lamp extends MapObject {
  static texture = "props";
  static type = {
    name: '1',
    uvStartPx: { u: 491, v: 1640 },
    widthPx: 13,
    heightPx: 17,
    zoffset: 3,
    collision: { startx: 0, starty: 11, width: 9, height: 6 }
  };

  constructor(scene, x, y, options = {}) {
    super(scene, x, y, Lamp.texture, Lamp.type.uvStartPx, Lamp.type.widthPx, Lamp.type.heightPx, Lamp.type.zoffset);

    this.type = Lamp.type.name;
    this.hasCollision = options.used || false;
    
    this._setupLight(x, y);
    
    if (this.hasCollision) {
      this._setupCollision();
    }
  }

  _setupLight(x, y) {
    const centerX = x + (this.width / 2);
    const centerY = y + (this.height / 2);
    
    this.light = this.scene.lightManager.addLight(
      centerX, 
      centerY, 
      160, 
      0xFFF8E0, 
      0.92, 
      1.05
    );
  }

  _setupCollision() {
    const { startx, starty, width, height } = Lamp.type.collision;
    this.image.body.setSize(width, height).setOffset(startx, starty);
  }

  setPosition(x, y) {
    super.setPosition(x, y);
    
    if (this.light) {
      this.light.x = x + (this.width / 2);
      this.light.y = y + (this.height / 2);
    }
  }
  
  destroy() {
    if (this.light) {
      this.scene.lightManager.removeLightObj(this.light);
      this.light = null;
    }
    
    super.destroy();
  }
}
