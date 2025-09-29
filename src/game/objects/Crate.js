import MapObject from './MapObject.js';

export default class Crate extends MapObject {
  static texture = "props";
    static types = [
      {
        name: 'empty_h',
        uvStartPx: { u: 224, v: 231 },
        widthPx: 34,
        heightPx: 25,
        zoffset: 4,
        collision: { startx: 0, starty: 15, width: 32, height: 10 }
      },
      {
        name: 'empty_v',
        uvStartPx: { u: 261, v: 223 },
        widthPx: 25,
        heightPx: 33,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 23, height: 23 }
      },
      {
        name: 'apple_h',
        uvStartPx: { u: 224, v: 295 },
        widthPx: 34,
        heightPx: 25,
        zoffset: 4,
        collision: { startx: 0, starty: 15, width: 32, height: 10 }
      },
      {
        name: 'apple_v',
        uvStartPx: { u: 261, v: 287 },
        widthPx: 25,
        heightPx: 33,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 23, height: 23 }
      },
      {
        name: 'lemom_h',
        uvStartPx: { u: 288, v: 295 },
        widthPx: 34,
        heightPx: 25,
        zoffset: 4,
        collision: { startx: 0, starty: 15, width: 32, height: 10 }
      },
      {
        name: 'lemon_v',
        uvStartPx: { u: 325, v: 287 },
        widthPx: 25,
        heightPx: 33,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 23, height: 23 }
      },
      {
        name: 'pear_h',
        uvStartPx: { u: 288, v: 231 },
        widthPx: 34,
        heightPx: 25,
        zoffset: 4,
        collision: { startx: 0, starty: 15, width: 32, height: 10 }
      },
      {
        name: 'pear_v',
        uvStartPx: { u: 325, v: 223 },
        widthPx: 25,
        heightPx: 33,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 23, height: 23 }
      },
      {
        name: 'fish_h',
        uvStartPx: { u: 352, v: 231 },
        widthPx: 34,
        heightPx: 25,
        zoffset: 4,
        collision: { startx: 0, starty: 15, width: 32, height: 10 }
      },
      {
        name: 'fish_v',
        uvStartPx: { u: 389, v: 222 },
        widthPx: 25,
        heightPx: 34,
        zoffset: 10,
        collision: { startx: 0, starty: 11, width: 23, height: 23 }
      },
      {
        name: 'carrot_h',
        uvStartPx: { u: 351, v: 291 },
        widthPx: 36,
        heightPx: 29,
        zoffset: 4,
        collision: { startx: 0, starty: 19, width: 33, height: 10 }
      },
      {
        name: 'carrot_v',
        uvStartPx: { u: 389, v: 284 },
        widthPx: 25,
        heightPx: 36,
        zoffset: 10,
        collision: { startx: 0, starty: 13, width: 23, height: 23 }
      },
      {
        name: 'cabbage_h',
        uvStartPx: { u: 415, v: 290 },
        widthPx: 35,
        heightPx: 30,
        zoffset: 4,
        collision: { startx: 0, starty: 20, width: 32, height: 10 }
      },
      {
        name: 'cabbage_v',
        uvStartPx: { u: 453, v: 285 },
        widthPx: 25,
        heightPx: 35,
        zoffset: 10,
        collision: { startx: 0, starty: 12, width: 23, height: 23 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(Crate.types.length);
    const type = Crate.types[index];

    super(scene, x, y, Crate.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
