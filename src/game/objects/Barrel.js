import MapObject from './MapObject.js';

export default class Barrel extends MapObject {
  static texture = "props";
    static types = [
      {
        name: 'normal',
        uvStartPx: { u: 225, v: 1114 },
        widthPx: 33,
        heightPx: 38,
        zoffset: 10,
        collision: { startx: 0, starty: 18, width: 30, height: 20 }
      },
      {
        name: 'without_cap',
        uvStartPx: { u: 289, v: 1114 },
        widthPx: 33,
        heightPx: 38,
        zoffset: 10,
        collision: { startx: 0, starty: 18, width: 30, height: 20 }
      },
      {
        name: 'with_water',
        uvStartPx: { u: 225, v: 1178 },
        widthPx: 33,
        heightPx: 38,
        zoffset: 10,
        collision: { startx: 0, starty: 18, width: 30, height: 20 }
      },
      {
        name: 'with_plant',
        uvStartPx: { u: 353, v: 1104 },
        widthPx: 36,
        heightPx: 48,
        zoffset: 10,
        collision: { startx: 0, starty: 28, width: 30, height: 20 }
      },
      {
        name: 'with_props',
        uvStartPx: { u: 289, v: 1168 },
        widthPx: 35,
        heightPx: 48,
        zoffset: 10,
        collision: { startx: 0, starty: 28, width: 30, height: 20 }
      },
      {
        name: 'sided',
        uvStartPx: { u: 225, v: 1242 },
        widthPx: 32,
        heightPx: 38,
        zoffset: 10,
        collision: { startx: 0, starty: 18, width: 30, height: 20 }
      },
      {
        name: 'pile',
        uvStartPx: { u: 290, v: 1225 },
        widthPx: 62,
        heightPx: 54,
        zoffset: 10,
        collision: { startx: 0, starty: 34, width: 60, height: 20 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(Barrel.types.length);
    const type = Barrel.types[index];

    super(scene, x, y, Barrel.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
