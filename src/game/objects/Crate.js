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
      
{
  name: 'flower_e_h',
  uvStartPx: { u: 932, v: 1035 },
  widthPx: 57,
  heightPx: 21,
  zoffset: 10,
  collision: { startx: 0, starty: 7, width: 54, height: 14 }
},
{
  name: 'flower_e_v',
  uvStartPx: { u: 998, v: 1035 },
  widthPx: 22,
  heightPx: 47,
  zoffset: 10,
  collision: { startx: 0, starty: 6, width: 20, height: 41 }
},

{
  name: 'flower_w_v',
  uvStartPx: { u: 1028, v: 1027 },
  widthPx: 26,
  heightPx: 55,
  zoffset: 10,
  collision: { startx: 2, starty: 12, width: 19, height: 43 }
},
{
  name: 'flower_y_v',
  uvStartPx: { u: 1060, v: 1031 },
  widthPx: 25,
  heightPx: 50,
  zoffset: 10,
  collision: { startx: 2, starty: 8, width: 19, height: 43 }
},
{
  name: 'flower_wl_v',
  uvStartPx: { u: 1093, v: 1027 },
  widthPx: 24,
  heightPx: 55,
  zoffset: 10,
  collision: { startx: 1, starty: 12, width: 19, height: 43 }
},
{
  name: 'flower_d_v',
  uvStartPx: { u: 1127, v: 1035 },
  widthPx: 22,
  heightPx: 47,
  zoffset: 10,
  collision: { startx: 0, starty: 4, width: 19, height: 43 }
},

{
  name: 'flower_w_h',
  uvStartPx: { u: 930, v: 1062 },
  widthPx: 62,
  heightPx: 26,
  zoffset: 10,
  collision: { startx: 3, starty: 14, width: 54, height: 12 }
},
{
  name: 'flower_y_h',
  uvStartPx: { u: 930, v: 1092 },
  widthPx: 60,
  heightPx: 27,
  zoffset: 10,
  collision: { startx: 3, starty: 15, width: 54, height: 12 }
},
{
  name: 'flower_wl_h',
  uvStartPx: { u: 933, v: 1125 },
  widthPx: 59,
  heightPx: 27,
  zoffset: 10,
  collision: { startx: 0, starty: 15, width: 54, height: 12 }
},
{
  name: 'flower_d_h',
  uvStartPx: { u: 933, v: 1163 },
  widthPx: 54,
  heightPx: 21,
  zoffset: 10,
  collision: { startx: 0, starty: 9, width: 54, height: 12 }
}
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
