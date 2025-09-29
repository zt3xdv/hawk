import MapObject from './MapObject.js';

export default class MoreNature extends MapObject {
  static texture = "plants";
    static types = [
      {
        name: 'cabbage_1',
        uvStartPx: { u: 867, v: 646 },
        widthPx: 29,
        heightPx: 22,
        zoffset: 5,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      {
        name: 'cabbage_2',
        uvStartPx: { u: 931, v: 648 },
        widthPx: 28,
        heightPx: 19,
        zoffset: 3,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      {
        name: 'cabbage_3',
        uvStartPx: { u: 999, v: 652 },
        widthPx: 19,
        heightPx: 14,
        zoffset: 3,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      
      {
        name: 'pumpkin_1',
        uvStartPx: { u: 861, v: 674 },
        widthPx: 38,
        heightPx: 28,
        zoffset: 5,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      {
        name: 'pumpkin_2',
        uvStartPx: { u: 931, v: 678 },
        widthPx: 31,
        heightPx: 21,
        zoffset: 3,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      {
        name: 'pumpkin_3',
        uvStartPx: { u: 1000, v: 682 },
        widthPx: 18,
        heightPx: 14,
        zoffset: 3,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      
      {
        name: 'carrot_1',
        uvStartPx: { u: 869, v: 707 },
        widthPx: 25,
        heightPx: 24,
        zoffset: 5,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      {
        name: 'carrot_2',
        uvStartPx: { u: 935, v: 711 },
        widthPx: 20,
        heightPx: 18,
        zoffset: 4,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
      {
        name: 'carrot_3',
        uvStartPx: { u: 1000, v: 713 },
        widthPx: 16,
        heightPx: 15,
        zoffset: 3,
        collision: { startx: 0, starty: 0, width: 0, height: 0 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(MoreNature.types.length);
    const type = MoreNature.types[index];

    super(scene, x, y, MoreNature.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
