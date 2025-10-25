import HawkEngine from '../../dist/engine/main.js';
import PreviewScene from './scenes/PreviewScene.js';

export default class Preview {
  constructor(domElement) {
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

    this.game = new HawkEngine.Game(config);
  }
}
