import * as Phaser from 'phaser';
import DashScene from './scenes/DashScene.js';

export default class Preview {
  constructor(domElement) {
    domElement.style.overflow = "hidden";
    document.fonts.load('48px Hawk');

    const config = {
      banner: false,
      parent: domElement,
      pixelArt: true,
      width: 128,
      height: 128,
      physics: {
        default: 'arcade',
        arcade: {}
      },
      scene: [
        DashScene
      ]
    };

    this.game = new Phaser.Game(config);
  }
}
