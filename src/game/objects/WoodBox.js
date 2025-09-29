import MapObject from './MapObject.js';

export default class WoodBox extends MapObject {
  static texture = "props";
    static types = [
      {
        name: '1',
        uvStartPx: { u: 96, v: 18 },
        widthPx: 39,
        heightPx: 46,
        zoffset: 20,
        collision: { startx: 0, starty: 26, width: 32, height: 20 }
      },
      {
        name: '2',
        uvStartPx: { u: 163, v: 22 },
        widthPx: 31,
        heightPx: 39,
        zoffset: 10,
        collision: { startx: 0, starty: 25, width: 26, height: 14 }
      },
      {
        name: '3',
        uvStartPx: { u: 95, v: 81 },
        widthPx: 41,
        heightPx: 47,
        zoffset: 20,
        collision: { startx: 0, starty: 27, width: 32, height: 20 }
      },
      {
        name: '4',
        uvStartPx: { u: 162, v: 85 },
        widthPx: 33,
        heightPx: 40,
        zoffset: 10,
        collision: { startx: 0, starty: 25, width: 26, height: 24 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(WoodBox.types.length);
    const type = WoodBox.types[index];

    super(scene, x, y, WoodBox.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
