import MapObject from './MapObject.js';

export default class Tree extends MapObject {
  static texture = "plants";
    static types = [
      {
        name: '1',
        uvStartPx: { u: 19, v: 76 },
        widthPx: 65,
        heightPx: 108,
        zoffset: 8,
        collision: { startx: 25, starty: 97, width: 6, height: 11 }
      },
      {
        name: '2',
        uvStartPx: { u: 104, v: 59 },
        widthPx: 87,
        heightPx: 124,
        zoffset: 7,
        collision: { startx: 35, starty: 115, width: 8, height: 9 }
      },
      {
        name: '3',
        uvStartPx: { u: 196, v: 42 },
        widthPx: 96,
        heightPx: 141,
        zoffset: 10,
        collision: { startx: 39, starty: 127, width: 11, height: 13 }
      },
      {
        name: '4',
        uvStartPx: { u: 319, v: 21 },
        widthPx: 112,
        heightPx: 162,
        zoffset: 10,
        collision: { startx: 43, starty: 147, width: 12, height: 15 }
      },
      {
        name: '5',
        uvStartPx: { u: 445, v: 5 },
        widthPx: 117,
        heightPx: 180,
        zoffset: 10,
        collision: { startx: 46, starty: 163, width: 13, height: 15 }
      },
      {
        name: '6',
        uvStartPx: { u: 19, v: 271 },
        widthPx: 65,
        heightPx: 108,
        zoffset: 10,
        collision: { startx: 25, starty: 97, width: 6, height: 11 }
      },
      {
        name: '7',
        uvStartPx: { u: 104, v: 254 },
        widthPx: 87,
        heightPx: 124,
        zoffset: 8,
        collision: { startx: 35, starty: 115, width: 8, height: 9 }
      },
      {
        name: '8',
        uvStartPx: { u: 196, v: 237 },
        widthPx: 96,
        heightPx: 141,
        zoffset: 10,
        collision: { startx: 39, starty: 127, width: 11, height: 13 }
      },
      {
        name: '9',
        uvStartPx: { u: 319, v: 216 },
        widthPx: 112,
        heightPx: 162,
        zoffset: 10,
        collision: { startx: 43, starty: 147, width: 12, height: 15 }
      },
      {
        name: '10',
        uvStartPx: { u: 445, v: 200 },
        widthPx: 117,
        heightPx: 180,
        zoffset: 10,
        collision: { startx: 46, starty: 163, width: 13, height: 15 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(Tree.types.length);
    const type = Tree.types[index];

    super(scene, x, y, Tree.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
