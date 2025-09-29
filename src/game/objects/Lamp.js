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

  constructor(scene, x, y, options = { used: false }) {
    super(scene, x, y, Lamp.texture, Lamp.type.uvStartPx, Lamp.type.widthPx, Lamp.type.heightPx, Lamp.type.zoffset);

    this.type = Lamp.type.name;
    this.light = scene.lightManager.addLight(this.x + (this.width / 2), this.y + (this.height / 2), 150, 0xffffff, 0.9);
    
    if (options.used) {
      const { startx, starty, width, height } = Lamp.type.collision;
      this.image.body.setSize(width, height);
      this.image.body.setOffset(startx, starty);
    }
  }
  
  destroy() {
    this.scene.lightManager.removeLightObj(this.light);
    
    super.destroy();
  }
}
