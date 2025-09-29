import MapObject from './MapObject.js';

export default class Outdoor extends MapObject {
  static texture = "props";
    static types = [
      {
        name: 'bench_1_h',
        uvStartPx: { u: 537, v: 920 },
        widthPx: 82,
        heightPx: 40,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 77, height: 30 }
      },
      {
        name: 'bench_1_v_1',
        uvStartPx: { u: 544, v: 974 },
        widthPx: 34,
        heightPx: 82,
        zoffset: 20,
        collision: { startx: 4, starty: 15, width: 22, height: 67 }
      },
      {
        name: 'bench_1_v_2',
        uvStartPx: { u: 608, v: 974 },
        widthPx: 35,
        heightPx: 82,
        zoffset: 20,
        collision: { startx: 4, starty: 15, width: 22, height: 67 }
      },
      
      // Horizontal
      {
        name: 'bench_2_h_1',
        uvStartPx: { u: 742, v: 1030 },
        widthPx: 84,
        heightPx: 20,
        zoffset: 9,
        collision: { startx: 0, starty: 10, width: 81, height: 10 }
      },
      {
        name: 'bench_2_h_2',
        uvStartPx: { u: 835, v: 1030 },
        widthPx: 61,
        heightPx: 20,
        zoffset: 9,
        collision: { startx: 0, starty: 10, width: 58, height: 10 }
      },
      
      // Vertical
      {
        name: 'bench_2_v_1',
        uvStartPx: { u: 712, v: 1053 },
        widthPx: 19,
        heightPx: 67,
        zoffset: 10,
        collision: { startx: 0, starty: 17, width: 17, height: 50 }
      },
      {
        name: 'bench_2_v_2',
        uvStartPx: { u: 744, v: 1070 },
        widthPx: 19,
        heightPx: 50,
        zoffset: 10,
        collision: { startx: 0, starty: 10, width: 17, height: 40 }
      },
      
      
      // END
      {
        name: 'table_1_h',
        uvStartPx: { u: 551, v: 1075 },
        widthPx: 85,
        heightPx: 45,
        zoffset: 20,
        collision: { startx: 0, starty: 10, width: 82, height: 35 }
      },
      {
        name: 'table_1_v',
        uvStartPx: { u: 652, v: 1045 },
        widthPx: 45,
        heightPx: 75,
        zoffset: 20,
        collision: { startx: 0, starty: 10, width: 41, height: 65 }
      },
      {
        name: 'table_2_h',
        uvStartPx: { u: 551, v: 1139 },
        widthPx: 85,
        heightPx: 45,
        zoffset: 20,
        collision: { startx: 0, starty: 10, width: 82, height: 35 }
      },
      {
        name: 'table_2_v',
        uvStartPx: { u: 652, v: 1141 },
        widthPx: 45,
        heightPx: 75,
        zoffset: 20,
        collision: { startx: 0, starty: 10, width: 41, height: 65 }
      },
    ];
    
  constructor(scene, x, y, typeNum = -1) {
    const index = typeNum != -1 ? typeNum : scene.random.getNextInt(Outdoor.types.length);
    const type = Outdoor.types[index];

    super(scene, x, y, Outdoor.texture, type.uvStartPx, type.widthPx, type.heightPx, type.zoffset);

    this.type = type.name;

    const { startx, starty, width, height } = type.collision;
    this.image.body.setSize(width, height);
    this.image.body.setOffset(startx, starty);
  }
}
