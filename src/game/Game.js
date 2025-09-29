import * as Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import Options from './utils/Options.js';

export default class Game {
  constructor(domElement) {
    domElement.style.overflow = "hidden";
    document.fonts.load('48px Hawk');
    
    window.FORCE_WEBGL = true;
    
    const config = {
      type: Phaser.WEBGL,
      banner: false,
      parent: domElement,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      fps: 60,
      render: {
        roundPixels: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      },
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
  
  _getScreenSize(scene) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    return { width, height };
  }

  _onResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    this.game.scale.resize(newWidth, newHeight);
    this.game.renderer.resize(newWidth, newHeight);

    const activeScenes = this.game.scene.getScenes(true);
    if (activeScenes.length) {
      const { width, height } = this._getScreenSize(activeScenes[0]);
    }
  }
}
