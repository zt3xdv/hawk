import Phaser from '../../../dist/engine/main.js';
import InputManager from '../managers/InputManager.js';
import NetworkManager from '../managers/NetworkManager.js';
import ConnectingOverlay from '../managers/ConnectingOverlay.js';
import LightManager from '../managers/LightManager.js';
import MapObjectManager from '../managers/MapObjectManager.js';
import Floor from '../objects/Floor.js';
import Random from '../utils/Random.js';
import ErrorModal from '../ui/ErrorModal.js';
import { DEV } from '../../utils/Constants.js';
import { getAssets, loadPack } from '../utils/Utils.js';

const SEND_INTERVAL = 100;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.zoom = 1;
    this.minZoom = 1;
    this.maxZoom = 2;
    this.movementTimer = 0;
    
    this.player = null;
    
    this.lastSentPos = { x: null, y: null };

    this.errorModal = new ErrorModal(document.getElementById('game-container'), this);

    this.dev = DEV;
    
    this.floor = null;
    
    this.mapSize = {
      width: 2048,
      height: 2048
    };
  }

  preload() {
    loadPack(this, getAssets());
  }

  create() {
    this._configureWorld(this.mapSize.width, this.mapSize.height);

    this.connectingOverlay = new ConnectingOverlay(this);
    this.connectingOverlay.show();
    
    this.floor             = new Floor(this, {
      mapPixelWidth: this.mapSize.width,
      mapPixelHeight: this.mapSize.height,
    });
    this.lightManager      = new LightManager(this, {
      startAtMinutes: 12
    });
    this.inputManager      = new InputManager(this);
    this.networkManager    = new NetworkManager(this);
    
    this.fpsElement = document.getElementById("fps-text");
    
    this.lightManager.create();
    this.random = new Random(12344);
    this.mapObjects = new MapObjectManager(this);

    this.collisionGroup = this.physics.add.group({
      immovable: true
    });
    
    this.game.events.emit('gameLoad');
  }

  update(time, delta) {
    this.fpsElement.innerHTML = "FPS - " + Math.floor(this.game.loop.actualFps) + "<br>" + this.game.renderer.constructor.name;
      
    const direction = this.inputManager.getDirection();
    
    if (this.player) {
      this.mapObjects.list.forEach(object => {
        if (!this.collisionGroup.contains(object.image)) {
          this.collisionGroup.add(object.image);
        }
        
        if (Phaser.Geom.Rectangle.Overlaps(this.player.sprite.getBounds(), object.image.getBounds()) && this.player.sprite.depth < object.image.depth) {
          if (!object.isOverlapping) {
            object.isOverlapping = true;
            this.tweens.add({
              targets: object.image,
              alpha: 0.5,
              duration: 150,
              ease: 'Linear'
            });
          }
        } else {
          if (object.isOverlapping) {
            object.isOverlapping = false;
            this.tweens.add({
              targets: object.image,
              alpha: 1,
              duration: 150,
              ease: 'Linear'
            });
          }
        }
      });

      this.player.update();
      this.player.updateMovement(direction);
      this.movementTimer += delta;

      if (this.movementTimer >= SEND_INTERVAL) {
        const px = Math.floor(this.player.sprite.x);
        const py = Math.floor(this.player.sprite.y);

        const lastX = this.lastSentPos.x;
        const lastY = this.lastSentPos.y;
        const positionChanged = lastX !== px || lastY !== py;

        if (positionChanged) {
          this.networkManager.emitMovement(px, py);
          this.lastSentPos.x = px;
          this.lastSentPos.y = py;
        }

        this.movementTimer -= SEND_INTERVAL;
      }
    } else {
      this.lastSentPos.x = null;
      this.lastSentPos.y = null;
    }
    
    this.lightManager.update(time, delta);
    this.mapObjects.update(time, delta);
  }

  zoomIn() {
    const cam = this.cameras.main;
    const newZoom = Phaser.Math.Clamp(this.zoom + 1.0, this.minZoom, this.maxZoom);
    this.tweens.add({
      targets: cam,
      zoom: newZoom,
      duration: 500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.zoom = newZoom;
        this.networkManager.emitRange(this.getCameraInfo().maxSize / 2);
      }
    });
  }

  zoomOut() {
    const cam = this.cameras.main;
    const newZoom = Phaser.Math.Clamp(this.zoom - 1.0, this.minZoom, this.maxZoom);
    this.tweens.add({
      targets: cam,
      zoom: newZoom,
      duration: 500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.zoom = newZoom;
        this.networkManager.emitRange(this.getCameraInfo().maxSize / 2);
      }
    });
  }

  getCameraInfo(camera = this.cameras.main) {
    const left = camera.worldView.x;
    const top = camera.worldView.y;

    const width = camera.worldView.width;
    const height = camera.worldView.height;

    const maxSize = Math.max(width, height);

    return {
      x: left,
      y: top,
      width,
      height,
      maxSize
    };
  }

  _configureWorld(width, height) {
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
  }

  isVisible(camera, gameObject) {
    const camRect = camera.worldView; 
    const goRect = gameObject.getBounds(); 
    return Phaser.Geom.Intersects.RectangleToRectangle(camRect, goRect);
  }
}
