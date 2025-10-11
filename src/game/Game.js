import Phaser from '../../dist/engine/main.js';
import GameScene from './scenes/GameScene.js';
import Options from './utils/Options.js';

export default class Game {
  constructor(domElement) {
    domElement.style.overflow = "hidden";
    document.fonts.load('48px Hawk');
    
    const config = {
      banner: false,
      parent: domElement,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      /*render: {
        roundPixels: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      },*/
      physics: {
        default: 'arcade',
        arcade: {
          debug: Options.get("debug")
        }
      },
      scene: [
        GameScene
      ]
    };

    this.game = new Phaser.Game(config);

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this._onResize(), 200);
    });
  }
  
  _onResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    this.game.scale.resize(newWidth, newHeight);
    this.game.renderer.resize(newWidth, newHeight);
  }
}
