import HawkEngine from '../../../dist/engine/main.js';
import Player from '../entities/Player.js';
import { escapeHtml, getAuth, apiPost, getAssets, loadPack } from '../utils/Utils.js';
import { API } from '../../utils/Constants.js';
import Floor from '../objects/Floor.js';

export default class PreviewScene extends HawkEngine.Scene {
  constructor() {
    super({ key: 'DashScene' });
    this.player = null;
    this.timed = 6000;
    
    this.messages = ["WE REALLY NEED", "WS FOR SUBDOMAINS", "REALYYYYYYYYYY"];
    this.msgIndex = this.messages.length - 1;
  }

  preload() {
    loadPack(this, getAssets());
  }

  create() {
    this.floor             = new Floor(this, {
      mapPixelWidth: 4 * 32,
      mapPixelHeight: 4 * 32
    });
    
    (async () => {
      const data = await apiPost(API.check, getAuth());
      const id = data.id || "000_000000";
      
      this.player = new Player(this, id + "_b", id, data.username || "___", "", 64, 82, data.game.avatar || "");
      this.player.sprite.setInteractive({ draggable: true });
      this.player.sprite.on('drag', (pointer, dragX, dragY) => {
        this.player.setPosition(dragX, dragY);
      });
    })();
  }

  update(time, delta) {
    if (!this.player) return;
    
    this.timed += delta;
    if (this.timed >= 6000) {
      this.timed = 0;
      this.msgIndex = (this.msgIndex + 1) % this.messages.length;
      
      this.player.say(this.messages[this.msgIndex], false);
    }
    
    this.player.update({ x: 0, y: 0 });
  }
}
