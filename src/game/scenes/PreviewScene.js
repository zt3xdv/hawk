import Scene from '../../hawk/scene/Scene.js';
import Player from '../entities/Player.js';
import { escapeHtml, getAuth, apiPost, getAssets, loadPack } from '../utils/Utils.js';
import { API } from '../../utils/Constants.js';
import TileManager from '../managers/TileManager.js';
import LightManager from '../managers/LightManager.js';
import Tree from '../objects/Tree.js';

export default class PreviewScene extends Scene {
  constructor() {
    super({ key: 'DashScene' });
    this.player = null;
  }

  preload() {
    loadPack(this, getAssets());
  }

  create() {
    this.tileManager = new TileManager(this, {
      mapPixelWidth: 256,
      mapPixelHeight: 256,
      tileSize: 32
    });
    
    this.tileManager.loadTilesFromData([
      {
        x: 4,
        y: 1,
        type: "dirt"
      },
      {
        x: 4,
        y: 0,
        type: "dirt"
      },
      {
        x: 3,
        y: 0,
        type: "dirt"
      },
      {
        x: 3,
        y: 1,
        type: "dirt"
      },
      {
        x: 3,
        y: 2,
        type: "dirt"
      }
    ]);
    this.tileManager.create();
    
    this.lightManager = new LightManager(this, {
      startAtMinutes: 23,
      timeScale: 0
    });
    this.lightManager.create();
    
    this.elements = [
      new Tree(this, -20, -120, 4),
      new Tree(this, 60, 10, 2)
    ];
    
    (async () => {
      const data = await apiPost(API.check, getAuth());
      const id = data.id || "000_000000";
      
      this.player = new Player(this, id + "_b", id, data.username || "___", "", 64, 82, data.game.avatar || "");
      this.player.sprite.setInteractive({ draggable: true });
      this.player.chat.setTyping(true);
    })();
  }

  update(time, delta) {
    if (!this.player) return;
    this.player.update({ x: 0, y: 0 });
  }
}
