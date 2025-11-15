

export default class TileManager {
  constructor(scene, {
    mapPixelWidth = 2048,
    mapPixelHeight = 2048,
    tileSize = 32
  } = {}) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.widthPx = mapPixelWidth;
    this.heightPx = mapPixelHeight;
    
    this.cols = Math.ceil(this.widthPx / this.tileSize);
    this.rows = Math.ceil(this.heightPx / this.tileSize);
    
    this.tiles = Array.from({ length: this.cols }, () => 
      Array.from({ length: this.rows }, () => ({ type: 'grass' }))
    );
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.widthPx;
    this.canvas.height = this.heightPx;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    this.sprite = null;
    
    this.setupTextures();
    this.setupRules();
  }
  
  setupTextures() {
    const dirtTex = this.scene.textures.get('dirt');
    const grassTex = this.scene.textures.get('grass2');
    if (!dirtTex || !grassTex) {
      throw new Error("Require textures 'dirt' and 'grass2' loaded in scene.");
    }
    this.dirtImage = dirtTex.getSourceImage();
    this.grassImage = grassTex.getSourceImage();
  }
  
  setupRules() {
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
  }
  
  loadTilesFromData(tilesData = []) {
    tilesData.forEach(tile => {
      const { x, y, type } = tile;
      if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
        this.tiles[x][y] = { type };
      }
    });
  }
  
  exportTiles() {
    const tilesData = [];
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (this.tiles[x][y].type !== 'grass') {
          tilesData.push({ x, y, type: this.tiles[x][y].type });
        }
      }
    }
    return tilesData;
  }
  
  isGrass(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    return this.tiles[x][y].type === 'grass';
  }
  
  neighbors4(x, y) {
    return {
      n: this.isGrass(x, y - 1),
      s: this.isGrass(x, y + 1),
      w: this.isGrass(x - 1, y),
      e: this.isGrass(x + 1, y)
    };
  }
  
  neighbors8(x, y) {
    return {
      nw: this.isGrass(x - 1, y - 1),
      ne: this.isGrass(x + 1, y - 1),
      sw: this.isGrass(x - 1, y + 1),
      se: this.isGrass(x + 1, y + 1)
    };
  }
  
  classify(x, y) {
    const self = this.isGrass(x, y);
    const n4 = this.neighbors4(x, y);
    const n8 = this.neighbors8(x, y);
    const totalAdjacent = [n4.n, n4.s, n4.w, n4.e, n8.nw, n8.ne, n8.sw, n8.se].filter(Boolean).length;
    const s = { self, ...n4, ...n8, totalAdjacent };
    
    for (const r of this.rules) {
      if (r.test(s)) return (r.out || r.name).toLowerCase();
    }
    return 'grass';
  }
  
  getRandomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  setTile(worldX, worldY, type) {
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);
    
    if (tileX >= 0 && tileX < this.cols && tileY >= 0 && tileY < this.rows) {
      this.tiles[tileX][tileY] = { type };
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = tileX + dx;
          const ny = tileY + dy;
          if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
            this.renderTile(nx, ny);
          }
        }
      }
      
      this.updateTexture();
      return { x: tileX, y: tileY, type };
    }
    return null;
  }
  
  renderTile(tileX, tileY) {
    const tile = this.tiles[tileX][tileY];
    const dx = tileX * this.tileSize;
    const dy = tileY * this.tileSize;
    
    if (tile.type === 'dirt') {
      const indexX = Math.floor(Math.random() * 4) * this.tileSize;
      const indexY = Math.floor(Math.random() * 4) * this.tileSize;
      this.ctx.drawImage(this.dirtImage, indexX, indexY, this.tileSize, this.tileSize, dx, dy, this.tileSize, this.tileSize);
    } else {
      const dirtIndexX = Math.floor(Math.random() * 4) * this.tileSize;
      const dirtIndexY = Math.floor(Math.random() * 4) * this.tileSize;
      this.ctx.drawImage(this.dirtImage, dirtIndexX, dirtIndexY, this.tileSize, this.tileSize, dx, dy, this.tileSize, this.tileSize);
      
      const name = this.classify(tileX, tileY);
      const t = this.types[name];
      
      if (t) {
        let coords = t;
        if (t.rand) {
          coords = this.getRandomFrom(t.rand);
        }
        
        const sx = coords.x * this.tileSize;
        const sy = coords.y * this.tileSize;
        this.ctx.drawImage(this.grassImage, sx, sy, this.tileSize, this.tileSize, dx, dy, this.tileSize, this.tileSize);
      }
    }
  }
  
  renderAll() {
    this.ctx.clearRect(0, 0, this.widthPx, this.heightPx);
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.renderTile(x, y);
      }
    }
    
    this.updateTexture();
  }
  
  updateTexture() {
    const textureKey = 'floor_dynamic';
    if (this.scene.textures.exists(textureKey)) {
      this.scene.textures.remove(textureKey);
    }
    this.scene.textures.addCanvas(textureKey, this.canvas);
    
    if (this.sprite) {
      this.sprite.setTexture(textureKey);
    } else {
      this.sprite = this.scene.add.image(0, 0, textureKey).setOrigin(0).setDepth(-1000);
    }
  }
  
  create() {
    this.renderAll();
  }
  
  destroy() {
    const textureKey = 'floor_dynamic';
    if (this.scene.textures.exists(textureKey)) {
      this.scene.textures.remove(textureKey);
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
  
  clearTiles() {
    this.tiles = Array.from({ length: this.cols }, () => 
      Array.from({ length: this.rows }, () => ({ type: 'grass' }))
    );
    this.renderAll();
  }
  
  loadTiles(tilesData) {
    this.clearTiles();
    
    if (Array.isArray(tilesData)) {
      tilesData.forEach(tile => {
        const { x, y, type } = tile;
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
          this.tiles[x][y] = { type };
        }
      });
    }
    
    this.renderAll();
  }
}
