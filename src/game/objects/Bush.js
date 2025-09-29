import MapObject from './MapObject.js';

export default class Bush extends MapObject {
  static texture = "plants";
    static types = [
      {
        name: '1',
        uvStartPx: { u: 34, v: 899 },
        widthPx: 32,
        heightPx: 27,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 25, height: 17 }
      },
      {
        name: '2',
        uvStartPx: { u: 93, v: 896 },
        widthPx: 41,
        heightPx: 30,
        zoffset: 12,
        collision: { startx: 0, starty: 15, width: 36, height: 15 }
      },
      {
        name: '3',
        uvStartPx: { u: 153, v: 887 },
        widthPx: 45,
        heightPx: 39,
        zoffset: 13,
        collision: { startx: 0, starty: 20, width: 40, height: 18 }
      },
      {
        name: '4',
        uvStartPx: { u: 217, v: 890 },
        widthPx: 50,
        heightPx: 38,
        zoffset: 15,
        collision: { startx: 0, starty: 20, width: 44, height: 18 }
      },
      {
        name: '5',
        uvStartPx: { u: 293, v: 886 },
        widthPx: 61,
        heightPx: 41,
        zoffset: 15,
        collision: { startx: 0, starty: 18, width: 57, height: 23 }
      },
      {
        name: '6',
        uvStartPx: { u: 379, v: 886 },
        widthPx: 79,
        heightPx: 45,
        zoffset: 16,
        collision: { startx: 0, starty: 20, width: 71, height: 25 }
      },
      {
        name: '7',
        uvStartPx: { u: 472, v: 872 },
        widthPx: 85,
        heightPx: 57,
        zoffset: 18,
        collision: { startx: 0, starty: 30, width: 80, height: 27 }
      },
      {
        name: '8',
        uvStartPx: { u: 34, v: 963 },
        widthPx: 32,
        heightPx: 27,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 25, height: 17 }
      },
      {
        name: '9',
        uvStartPx: { u: 93, v: 960 },
        widthPx: 41,
        heightPx: 30,
        zoffset: 12,
        collision: { startx: 0, starty: 15, width: 36, height: 15 }
      },
      {
        name: '10',
        uvStartPx: { u: 153, v: 951 },
        widthPx: 45,
        heightPx: 39,
        zoffset: 13,
        collision: { startx: 0, starty: 20, width: 40, height: 18 }
      },
      {
        name: '11',
        uvStartPx: { u: 217, v: 954 },
        widthPx: 50,
        heightPx: 38,
        zoffset: 15,
        collision: { startx: 0, starty: 20, width: 44, height: 18 }
      },
      {
        name: '12',
        uvStartPx: { u: 293, v: 950 },
        widthPx: 61,
        heightPx: 41,
        zoffset: 15,
        collision: { startx: 0, starty: 18, width: 57, height: 23 }
      },
      {
        name: '13',
        uvStartPx: { u: 379, v: 950 },
        widthPx: 79,
        heightPx: 45,
        zoffset: 16,
        collision: { startx: 0, starty: 20, width: 71, height: 25 }
      },
      {
        name: '14',
        uvStartPx: { u: 472, v: 936 },
        widthPx: 85,
        heightPx: 57,
        zoffset: 18,
        collision: { startx: 0, starty: 30, width: 80, height: 27 }
      },
    ];

    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(Bush.types.length);
    const type = Bush.types[index];

    super(scene, x, y, Bush.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
