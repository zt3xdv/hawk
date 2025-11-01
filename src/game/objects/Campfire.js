import MapObject from './MapObject.js';

export default class Campfire extends MapObject {
  static texture = "props";
  static types = [
    {
      name: '1',
      uvStartPx: { u: 905, v: 1728 },
      widthPx: 46,
      heightPx: 32,
      zoffset: 9,
      collision: { startx: 0, starty: 4, width: 46, height: 28 },
      lightOffset: { x: 23, y: 8 }
    }
  ];

  static FRAME_COUNT = 25;
  static FRAME_DURATION = 75;

  constructor(scene, x, y, typeIndex = 0) {
    const type = Campfire.types[typeIndex];
    super(scene, x, y, Campfire.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;
    this._setupCollision(type.collision);
    this._setupFire(x, y, type.lightOffset);
    
    this.frame = 0;
    this.frameTime = 0;
  }

  _setupCollision(collision) {
    const { startx, starty, width, height } = collision;
    this.image.body.setSize(width, height).setOffset(startx, starty);
  }

  _setupFire(x, y, lightOffset) {
    this.fireImage = this.scene.add.image(
      x + lightOffset.x - 15, 
      y + lightOffset.y - 15, 
      "flame"
    )
      .setOrigin(0, 0)
      .setDepth(y - 1)
      .setTint(0xFF7700);
      
    this.light = this.scene.lightManager.addLight(
      x + lightOffset.x, 
      y + lightOffset.y, 
      180, 
      0xFF8844, 
      0.95, 
      1.1
    );
  }
  
  update(time, delta) {
    super.update(time, delta);
    
    this.frameTime += delta;
    if (this.frameTime >= Campfire.FRAME_DURATION) {
      this.frameTime -= Campfire.FRAME_DURATION;
      this.frame = (this.frame + 1) % Campfire.FRAME_COUNT;
      this.fireImage.setFrame(this.frame);
    }
    
    this.fireImage.setDepth(this._calculateDepth(this.image.y));
  }
  
  setPosition(x, y) {
    super.setPosition(x, y);
    
    const type = Campfire.types[0];
    const offsetX = type.lightOffset.x - 15;
    const offsetY = type.lightOffset.y - 15;
    
    this.fireImage.setPosition(x + offsetX, y + offsetY);
    this.fireImage.setDepth(this._calculateDepth(y));
    
    if (this.light) {
      this.light.x = x + type.lightOffset.x;
      this.light.y = y + type.lightOffset.y;
    }
  }
  
  destroy() {
    if (this.fireImage) {
      if (this.fireImage.body) {
        this.scene.physics.world.disableBody(this.fireImage.body);
      }
      this.fireImage.destroy();
      this.fireImage = null;
    }
    
    if (this.light) {
      this.scene.lightManager.removeLightObj(this.light);
      this.light = null;
    }
    
    super.destroy();
  }
}
