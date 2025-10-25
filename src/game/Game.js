import HawkEngine from '../../dist/engine/main.js';
import GameScene from './scenes/GameScene.js';
import Options from './utils/Options.js';

export default class Game {
  constructor(domElement) {
    const config = {
      banner: false,
      parent: domElement,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      render: {
        roundPixels: true,
        preserveDrawingBuffer: true,
        antialias: false,
        antialiasGL: false,
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

    this.game = new HawkEngine.Game(config);
    
    window.addEventListener('resize', () => {
      this._onResize();
    });
  }
  
  _onResize() {
    const newWidth = (window.innerWidth * window.devicePixelRatio) / 2;
    const newHeight = (window.innerHeight * window.devicePixelRatio) / 2;
    this.game.scale.resize(newWidth, newHeight);
    this.game.renderer.resize(newWidth, newHeight);
  }
}
