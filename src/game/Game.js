import Game from '../hawk/core/Game.js';
import GameScene from './scenes/GameScene.js';
import Options from './utils/Options.js';

export default class HawkGame {
  constructor(domElement) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
    
    const config = {
      banner: false,
      parent: domElement,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      render: {
        roundPixels: true,
        preserveDrawingBuffer: false,
        antialias: false,
        antialiasGL: false,
        powerPreference: isMobile || isLowEnd ? "default" : "high-performance",
        batchSize: isMobile ? 1024 : 2048,
        maxTextures: isMobile ? 8 : 16,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: Options.get("debug"),
          fps: isMobile || isLowEnd ? 30 : 60
        }
      },
      fps: {
        target: isMobile || isLowEnd ? 30 : 60,
        forceSetTimeOut: isMobile
      },
      scene: [
        GameScene
      ]
    };

    this.game = new Game(config);
    this.resizeTimeout = null;
    
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this._onResize(), 200);
    });
  }
  
  _onResize() {
    const scale = Math.min(window.devicePixelRatio, 2);
    const newWidth = (window.innerWidth * scale) / 2;
    const newHeight = (window.innerHeight * scale) / 2;
    this.game.scale.resize(newWidth, newHeight);
    this.game.renderer.resize(newWidth, newHeight);
  }
}
