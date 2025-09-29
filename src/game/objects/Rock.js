import MapObject from './MapObject.js';

export default class Rock extends MapObject {
  static texture = "props";
  static types = [
      {
        name: '1',
        uvStartPx: { u: 683, v: 1994 },
        widthPx: 14,
        heightPx: 13,
        zoffset: 5,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '2',
        uvStartPx: { u: 681, v: 2026 },
        widthPx: 16,
        heightPx: 12,
        zoffset: 4,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '3',
        uvStartPx: { u: 715, v: 1994 },
        widthPx: 14,
        heightPx: 13,
        zoffset: 4,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '4',
        uvStartPx: { u: 713, v: 2026 },
        widthPx: 16,
        heightPx: 12,
        zoffset: 4,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '5',
        uvStartPx: { u: 740, v: 1991 },
        widthPx: 22,
        heightPx: 19,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '6',
        uvStartPx: { u: 739, v: 2028 },
        widthPx: 22,
        heightPx: 12,
        zoffset: 4,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '7',
        uvStartPx: { u: 770, v: 1990 },
        widthPx: 25,
        heightPx: 20,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '8',
        uvStartPx: { u: 771, v: 2021 },
        widthPx: 27,
        heightPx: 20,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '9',
        uvStartPx: { u: 801, v: 1991 },
        widthPx: 28,
        heightPx: 19,
        zoffset: 5,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '10',
        uvStartPx: { u: 847, v: 1954 },
        widthPx: 28,
        heightPx: 28,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '11',
        uvStartPx: { u: 845, v: 1990 },
        widthPx: 35,
        heightPx: 20,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '12',
        uvStartPx: { u: 848, v: 2016 },
        widthPx: 33,
        heightPx: 27,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '13',
        uvStartPx: { u: 904, v: 1953 },
        widthPx: 41,
        heightPx: 26,
        zoffset: 8,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '14',
        uvStartPx: { u: 909, v: 1985 },
        widthPx: 36,
        heightPx: 26,
        zoffset: 8,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '15',
        uvStartPx: { u: 912, v: 2016 },
        widthPx: 34,
        heightPx: 24,
        zoffset: 6,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '16',
        uvStartPx: { u: 969, v: 1965 },
        widthPx: 46,
        heightPx: 36,
        zoffset: 9,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
      {
        name: '17',
        uvStartPx: { u: 965, v: 2016 },
        widthPx: 55,
        heightPx: 30,
        zoffset: 9,
        collision: { startx: 0, starty: 4, width: 12, height: 6 }
      },
    ];

  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(Rock.types.length);
    const type = Rock.types[index];

    super(scene, x, y, Rock.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
