import MapObject from '../MapObject.js';

export default class HouseOne extends MapObject {
  static texture = "building";
    static type = {
      name: '1',
      uvStartPx: { u: 569, v: 425 },
      widthPx: 155,
      heightPx: 279,
      zoffset: 10,
      collision: { startx: 0, starty: 79, width: 142, height: 200 }
    };
    
  constructor(scene, x, y) {
    super(scene, x, y, HouseOne.texture, HouseOne.type.uvStartPx, HouseOne.type.widthPx, HouseOne.type.heightPx, HouseOne.type.zoffset);

    this.type = HouseOne.type.name;
    
    const { startx, starty, width, height } = HouseOne.type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
