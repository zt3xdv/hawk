import * as Phaser from 'phaser';
import Player from '../entities/Player.js';
import { escapeHtml, getAuth, apiPost, getAssets, loadPack } from '../utils/Utils.js';
import { API } from '../../utils/Constants.js';

export default class DashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DashScene' });
    this.player = null;
    this.timed = 6000;
    
    this.messages = ["Now we need...", "startup editing", "git manager", "multiple ports (2)", "and more btw..."];
    this.msgIndex = 0;
  }

  preload() {
    loadPack(this, getAssets());
  }

  create() {
    for (let i = 0; i < 16; i++) {
      const s = 32;
      this.add.image((i % 4) * 32, Math.floor(i / 4) * 32, 'dirt', Math.floor(Math.random() * 4)).setOrigin(0);
    }
    
    (async () => {
      const data = await apiPost(API.check, getAuth());
      const id = data.id || "000_000000";
      
      this.player = new Player(this, id + "_b", id, data.username || "___", "", 64, 82, data.game.avatar || "");
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
