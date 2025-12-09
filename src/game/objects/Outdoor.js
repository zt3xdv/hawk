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
      
{
  name: 'anvil',
  uvStartPx: { u: 154, v: 1123 },
  widthPx: 42,
  heightPx: 25,
  zoffset: 10,
  collision: { startx: 10, starty: 11, width: 24, height: 14 }
},

{
  name: 'bee_nest',
  uvStartPx: { u: 989, v: 1700 },
  widthPx: 44,
  heightPx: 59,
  zoffset: 5,
  collision: { startx: 4, starty: 41, width: 30, height: 18 }
},
{
  name: 'bird_house',
  uvStartPx: { u: 1059, v: 1703 },
  widthPx: 30,
  heightPx: 51,
  zoffset: 5,
  collision: { startx: 10, starty: 41, width: 6, height: 10 }
},

{
  name: 'hay_mount_1',
  uvStartPx: { u: 1065, v: 1466 },
  widthPx: 51,
  heightPx: 37,
  zoffset: 8,
  collision: { startx: 0, starty: 15, width: 47, height: 18 }
},
{
  name: 'hay_mount_2',
  uvStartPx: { u: 1133, v: 1445 },
  widthPx: 77,
  heightPx: 56,
  zoffset: 8,
  collision: { startx: 3, starty: 27, width: 67, height: 27 }
},
{
  name: 'hay_mount_3',
  uvStartPx: { u: 1222, v: 1424 },
  widthPx: 89,
  heightPx: 75,
  zoffset: 8,
  collision: { startx: 2, starty: 30, width: 77, height: 41 }
},

{
  name: 'hay_block_1',
  uvStartPx: { u: 1088, v: 1379 },
  widthPx: 34,
  heightPx: 28,
  zoffset: 8,
  collision: { startx: 0, starty: 9, width: 32, height: 19 }
},
{
  name: 'hay_block_2',
  uvStartPx: { u: 1156, v: 1373 },
  widthPx: 26,
  heightPx: 35,
  zoffset: 8,
  collision: { startx: 0, starty: 8, width: 24, height: 27 }
},

{
  name: 'hay_block_b1',
  uvStartPx: { u: 866, v: 1377 },
  widthPx: 31,
  heightPx: 31,
  zoffset: 5,
  collision: { startx: 0, starty: 10, width: 29, height: 21 }
},
{
  name: 'hay_block_b2',
  uvStartPx: { u: 923, v: 1377 },
  widthPx: 44,
  heightPx: 31,
  zoffset: 5,
  collision: { startx: 0, starty: 10, width: 42, height: 21 }
},

{
  name: 'flowerpot_empty',
  uvStartPx: { u: 902, v: 1317 },
  widthPx: 22,
  heightPx: 23,
  zoffset: 5,
  collision: { startx: 2, starty: 13, width: 16, height: 10 }
},
{
  name: 'flowerpot_dirt',
  uvStartPx: { u: 934, v: 1317 },
  widthPx: 22,
  heightPx: 23,
  zoffset: 5,
  collision: { startx: 2, starty: 13, width: 16, height: 10 }
},
{
  name: 'flowerpot_white',
  uvStartPx: { u: 965, v: 1312 },
  widthPx: 25,
  heightPx: 28,
  zoffset: 5,
  collision: { startx: 3, starty: 18, width: 16, height: 10 }
},
{
  name: 'flowerpot_yellow',
  uvStartPx: { u: 996, v: 1313 },
  widthPx: 25,
  heightPx: 27,
  zoffset: 5,
  collision: { startx: 4, starty: 17, width: 16, height: 10 }
},
{
  name: 'flowerpot_whitelarge',
  uvStartPx: { u: 1030, v: 1310 },
  widthPx: 22,
  heightPx: 30,
  zoffset: 5,
  collision: { startx: 2, starty: 20, width: 16, height: 10 }
},
{
  name: 'watering_can',
  uvStartPx: { u: 891, v: 1281 },
  widthPx: 38,
  heightPx: 28,
  zoffset: 5,
  collision: { startx: 11, starty: 19, width: 19, height: 9 }
}
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
