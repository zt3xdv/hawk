import * as Phaser from 'phaser';

export default class Floor extends Phaser.GameObjects.Container {
  constructor(scene, {
    textureKey = 'floor_dynamic',
    mapPixelWidth = 2048,
    mapPixelHeight = 2048,
    cellSize = 32,
    tilemapWidth = null,
    tilemapHeight = null,
    baseTilemap = null
  } = {}) {
    super(scene, 0, 0);
    this.scene = scene;
    this.cellSize = cellSize;
    this.textureKey = textureKey;
    this.widthPx = mapPixelWidth;
    this.heightPx = mapPixelHeight;

    this.cols = tilemapWidth || Math.ceil(this.widthPx / this.cellSize);
    this.rows = tilemapHeight || Math.ceil(this.heightPx / this.cellSize);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.widthPx;
    this.canvas.height = this.heightPx;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    const dirtTex = scene.textures.get('dirt');
    const grassTex = scene.textures.get('grass2');
    if (!dirtTex || !grassTex) {
      throw new Error("Require textures 'dirt' and 'grass2' loaded in scene.");
    }
    this.dirtImage = dirtTex.getSourceImage();
    this.grassImage = grassTex.getSourceImage();

    this.tilemapNames = Array.from({ length: this.cols }, () => new Array(this.rows));
    this.tilemapIds = Array.from({ length: this.cols }, () => new Array(this.rows));
    this.cells = Array.from({ length: this.cols }, () => new Array(this.rows).fill(false));

    this.rules = [
      { name: 'air', test: (s) => !s.self },
      { name: 'grass_isolated', test: (s) => s.self && s.totalAdjacent === 0 },
      { name: 'grass_horizontal_interior', test: (s) => s.self && (s.w && s.e) && !s.n && !s.s, out: 'grass' },
      { name: 'grass_left', test: (s) => s.self && s.w && !s.e && !s.n && !s.s, out: 'grass_left' },
      { name: 'grass_right', test: (s) => s.self && s.e && !s.w && !s.n && !s.s, out: 'grass_right' },
      { name: 'grass_vertical_interior', test: (s) => s.self && (s.n && s.s) && !s.w && !s.e, out: 'grass' },
      { name: 'grass_top', test: (s) => s.self && s.n && !s.s && !s.w && !s.e, out: 'grass_top' },
      { name: 'grass_bottom', test: (s) => s.self && s.s && !s.n && !s.w && !s.e, out: 'grass_bottom' },
      { name: 'grass_bottom_edges', test: (s) => s.self && s.s && !s.n && s.w && s.e, out: 'grass_bottom' },
      { name: 'grass_bottom_left', test: (s) => s.self && s.s && !s.n && s.w && !s.e, out: 'grass_bottom_left' },
      { name: 'grass_bottom_right', test: (s) => s.self && s.s && !s.n && s.e && !s.w, out: 'grass_bottom_right' },
      { name: 'grass_top_edges', test: (s) => s.self && s.n && !s.s && s.w && s.e, out: 'grass_top' },
      { name: 'grass_top_left', test: (s) => s.self && s.n && !s.s && s.w && !s.e, out: 'grass_top_left' },
      { name: 'grass_top_right', test: (s) => s.self && s.n && !s.s && s.e && !s.w, out: 'grass_top_right' },
      { name: 'grass_left_mixed', test: (s) => s.self && s.w && !s.e && (s.n || s.s), out: 'grass_left' },
      { name: 'grass_right_mixed', test: (s) => s.self && s.e && !s.w && (s.n || s.s), out: 'grass_right' },
      { name: 'grass_topleft_min', test: (s) => s.self && !s.se && (s.s || s.e), out: 'grass_top_left_min' },
      { name: 'grass_topright_min', test: (s) => s.self && !s.sw && (s.s || s.w), out: 'grass_top_right_min' },
      { name: 'grass_bottomleft_min', test: (s) => s.self && !s.ne && (s.n || s.e), out: 'grass_bottom_left_min' },
      { name: 'grass_bottomright_min', test: (s) => s.self && !s.nw && (s.n || s.w), out: 'grass_bottom_right_min' },
      { name: 'grass_fallback', test: (s) => s.self, out: 'grass' }
    ];

    this.types = {
      grass: { rand: [ {x:13,y:0},{x:14,y:0},{x:15,y:0},{x:12,y:1},{x:13,y:1},{x:14,y:1},{x:15,y:1},{x:12,y:2},{x:13,y:2},{x:14,y:2},{x:15,y:2},{x:12,y:3},{x:13,y:3},{x:14,y:3},{x:15,y:3} ] },
      air: { x:11,y:0 },
      grass_top_left_min: { x:0,y:3 },
      grass_bottom_left_min: { x:0,y:5 },
      grass_bottom_right_min: { x:2,y:5 },
      grass_top_right_min: { x:2,y:3 },
      grass_top: { rand:[{x:1,y:3},{x:1,y:2}] },
      grass_bottom: { rand:[{x:1,y:5},{x:1,y:0}] },
      grass_left: { rand:[{x:0,y:4},{x:2,y:1}] },
      grass_right: { rand:[{x:2,y:4},{x:0,y:1}] },
      grass_bottom_left: { x:2,y:0 },
      grass_bottom_right: { x:0,y:0 },
      grass_top_right: { x:0,y:2 },
      grass_top_left: { x:2,y:2 }
    };

    this.getRandomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    this.bitblt = (srcImg, sx, sy, sw, sh, dx, dy, flipX = false) => {
      if (!flipX) {
        this.ctx.drawImage(srcImg, sx, sy, sw, sh, dx, dy, sw, sh);
      } else {
        this.ctx.save();
        this.ctx.translate(dx + sw, dy);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, sw, sh);
        this.ctx.restore();
      }
    };

    const tilemapTexture = scene.textures.get('tilemap');
    if (tilemapTexture && tilemapTexture.source && tilemapTexture.source[0]) {
      const mapImg = tilemapTexture.getSourceImage();
      
      const tmp = document.createElement('canvas');
      tmp.width = mapImg.width;
      tmp.height = mapImg.height;
      const tctx = tmp.getContext('2d', { willReadFrequently: true });
      tctx.drawImage(mapImg, 0, 0);
      const imgd = tctx.getImageData(0, 0, tmp.width, tmp.height);
      this.refWidth = tmp.width;
      this.refHeight = tmp.height;
      this.refData = imgd.data;
    } else {
      this.refWidth = 0;
      this.refHeight = 0;
      this.refData = null;
    }

    this.getPixelGrass = (x, y) => {
      if (!this.refData) return null;
      if (x < 0 || x >= this.refWidth || y < 0 || y >= this.refHeight) return null;
      const idx = (y * this.refWidth + x) << 2;
      const r = this.refData[idx], g = this.refData[idx+1], b = this.refData[idx+2], a = this.refData[idx+3];
      if (a === 0) return false;
      const avg = (r + g + b) / 3;
      return avg < 128;
    };

    this.isGrass = (x, y, requesterX = x, requesterY = y) => {
      const val = this.getPixelGrass(x, y);
      if (val !== null) return val;
      if (!this.refData) return false;
      const rx = Math.max(0, Math.min(this.refWidth - 1, requesterX));
      const ry = Math.max(0, Math.min(this.refHeight - 1, requesterY));
      return this.getPixelGrass(rx, ry) === true;
    };

    this.neighbors4 = (x, y) => ({
      n: this.isGrass(x, y - 1, x, y),
      s: this.isGrass(x, y + 1, x, y),
      w: this.isGrass(x - 1, y, x, y),
      e: this.isGrass(x + 1, y, x, y)
    });
    this.neighbors8 = (x, y) => ({
      nw: this.isGrass(x - 1, y - 1, x, y),
      ne: this.isGrass(x + 1, y - 1, x, y),
      sw: this.isGrass(x - 1, y + 1, x, y),
      se: this.isGrass(x + 1, y + 1, x, y)
    });

    this.classify = (x, y) => {
      const self = this.isGrass(x, y);
      const n4 = this.neighbors4(x, y);
      const n8 = this.neighbors8(x, y);
      const connectedN = n4.n, connectedS = n4.s, connectedW = n4.w, connectedE = n4.e;
      const diagNW = n8.nw, diagNE = n8.ne, diagSW = n8.sw, diagSE = n8.se;
      const totalAdjacent = [connectedN, connectedS, connectedW, connectedE, diagNW, diagNE, diagSW, diagSE].filter(Boolean).length;
      const s = { self, n: connectedN, s: connectedS, w: connectedW, e: connectedE, nw: diagNW, ne: diagNE, sw: diagSW, se: diagSE, totalAdjacent };
      for (const r of this.rules) {
        if (r.test(s)) return (r.out || r.name).toLowerCase();
      }
      return 'grass';
    };

    const dirtTileSize = 32;
    for (let y = 0; y < this.heightPx / dirtTileSize; y++) {
      for (let x = 0; x < this.widthPx / dirtTileSize; x++) {
        const dx = x * dirtTileSize;
        const dy = y * dirtTileSize;
        const indexX = Math.floor(Math.random() * 4) * dirtTileSize;
        const indexY = Math.floor(Math.random() * 4) * dirtTileSize;
        this.bitblt(this.dirtImage, indexX, indexY, dirtTileSize, dirtTileSize, dx, dy);
      }
    }

    for (let tx = 0; tx < this.cols; tx++) {
      for (let ty = 0; ty < this.rows; ty++) {
        const name = this.classify(tx, ty);
        this.tilemapNames[tx][ty] = name;
        const t = this.types[name];
        this.tilemapIds[tx][ty] = { ...(t.rand ? { rand: t.rand.slice() } : t) };
        if (this.tilemapIds[tx][ty].rand) {
          const rand = this.getRandomFrom(this.tilemapIds[tx][ty].rand);
          this.tilemapIds[tx][ty].x = rand.x;
          this.tilemapIds[tx][ty].y = rand.y;
        }
        const sx = this.tilemapIds[tx][ty].x * this.cellSize;
        const sy = this.tilemapIds[tx][ty].y * this.cellSize;
        const dx = tx * this.cellSize;
        const dy = ty * this.cellSize;
        this.bitblt(this.grassImage, sx, sy, this.cellSize, this.cellSize, dx, dy);
      }
    }

    if (scene.textures.exists(this.textureKey)) scene.textures.remove(this.textureKey);
    scene.textures.addCanvas(this.textureKey, this.canvas);
    this.sprite = scene.add.image(0, 0, this.textureKey).setOrigin(0);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  destroy(fromScene) {
    if (this.scene.textures.exists(this.textureKey)) this.scene.textures.remove(this.textureKey);
    super.destroy(fromScene);
  }
}
