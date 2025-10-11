import Phaser from '../../dist/engine/main.js';
import PreviewScene from './scenes/PreviewScene.js';

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
        PreviewScene
      ]
    };

    this.game = new Phaser.Game(config);
  }
}
