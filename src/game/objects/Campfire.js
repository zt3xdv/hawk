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
      collision: { startx: 0, starty: 4, width: 46, height: 28 }
    },
  ];

  constructor(scene, x, y) {
    const type = Campfire.types[0];

    super(scene, x, y, Campfire.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
    
    this.lightXOffset = 8;
    this.lightYOffset = -15;

    this.fireImage = scene.add.image(x + this.lightXOffset, y + this.lightYOffset, "flame")
      .setOrigin(0, 0)
      .setDepth(y - 1);
      
    this.light = scene.lightManager.addLight(x + this.lightXOffset + 20, y + this.lightYOffset + 20, 150, 0xffffff, 0.9);
    this.fireImage.tint = 0xFF7700;
    
    this.frame = 0;
    this.frameTime = 0;
  }
  
  update(time, delta) {
    super.update(time, delta);
    
    this.frameTime += delta;
    if (this.frameTime >= 75) {
      this.frameTime = 0;
      this.frame = (this.frame + 1) % 25; // Assume que hay 25 frames en la animación
      this.fireImage.setFrame(this.frame);
    }
    this.fireImage.setDepth(this.image.y + this.height - this.zoffset);
  }
  
  setPosition(x, y) {
    super.setPosition(x, y);
    
    this.fireImage.setPosition(x + this.lightXOffset, y + this.lightYOffset);
    this.fireImage.setDepth(y - 1);
    
    this.light.x = x + this.lightXOffset + 20; // Corrige la posición del light para alinearse con la imagen
    this.light.y = y + this.lightYOffset + 20; // Corrige la posición del light para alinearse con la imagen
  }
  
  destroy() {
    if (this.fireImage.body) {
      this.scene.physics.world.disableBody(this.fireImage.body);
    }
    this.fireImage.destroy();
    
    this.scene.lightManager.removeLightObj(this.light);
    super.destroy(); // Mueve esta línea al final para asegurar que el objeto se elimine correctamente
  }
}
