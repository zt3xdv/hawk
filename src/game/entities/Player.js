import ChatBubbleManager from '../managers/ChatBubbleManager.js';
import { estimateReadTime } from '../utils/Utils.js';
import { PLAYER_SPEED_WALK, PLAYER_SPEED_RUN } from '../../utils/Constants.js';
import HawkEngine from '../../../dist/engine/main.js';

export default class Player {
  constructor(scene, id, uuid, username, display_name, x, y, avatar) {
    this.id = id;
    this.scene = scene;

    this.display_name = display_name;
    this.username = username;
    this.avatar = avatar;

    this.uuid = uuid;

    const key = 'avatar-' + uuid;

    this.sprite = scene.add.image(x, y,  'wah');
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setSize(32, 16).setOffset(0, 16);
    this.sprite.body.debugShowBody = false;
    this.sprite.body.roundPixels = true;

    this.sprite.setInteractive(/*{ 
      cursor: 'pointer',
      useHandCursor: true,
      pixelPerfect: false
    }*/);
    this.sprite.setData('playerId', id);
    this.sprite.setData('playerUuid', uuid);
    this.sprite.setData('playerData', {
      id,
      uuid,
      username,
      display_name,
      avatar
    });
    
    this.sprite.on('pointerdown', () => {
      const scene = this.scene;
      if (scene && scene.inputManager && scene.inputManager.playerInfoModal) {
        scene.inputManager.playerInfoModal.showPlayer(uuid, {
          id,
          uuid,
          username,
          display_name,
          avatar
        });
      }
    });

    if (avatar) {
      const img = new Image();
      img.onload = () => {
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        this.scene.textures.addImage(key, img);
        this.sprite.setTexture(key);
      };
      img.onerror = (e) => {
        console.error('Error loading custom avatar', e);
      };
      img.src = avatar;
    }

    this.nameText = scene.add.bitmapText(Math.floor(x - 16), Math.floor(y - 32), 'hawkpixelated', display_name || '', 16, HawkEngine.GameObjects.BitmapText.ALIGN_LEFT).setDepth(10248);
    this.nameText.setCharacterTint(0, -1, true, 0xFFFFFF);
    
    this._positionTween = null;
    this._smoothDuration = 150;
    this._targetPosition = { x: x, y: y };
    this._interpolationSpeed = 0.25;

    this.chat = new ChatBubbleManager(scene, () => this.sprite.x, () => this.sprite.y, {
      bubblePaddingX: 6,
      bubblePaddingY: 4,
      bubbleSeparation: 4,
      bubbleDuration: 5000,
      bubbleMaxWidth: 200,
      bubbleLimit: 5,
      bubblePosFPlayer: (!display_name || display_name == "") ? 24 : 40
    });
  }

  update() {
    this.chat.update();
  }

  updateMovement(direction) {
    const speed = direction.running ? PLAYER_SPEED_RUN : PLAYER_SPEED_WALK;
    const vx = Math.floor(direction.x * speed);
    const vy = Math.floor(direction.y * speed);
    
    if (this.sprite.body.velocity.x !== vx || this.sprite.body.velocity.y !== vy) {
      this.sprite.body.setVelocity(vx, vy);
    }
    
    const newX = Math.floor(this.sprite.x - Math.floor(this.sprite.width / 2));
    const newY = Math.floor(this.sprite.y - 30);
    
    if (this.nameText.x !== newX || this.nameText.y !== newY) {
      this.nameText.setPosition(newX, newY);
    }
    
    const newDepth = this.sprite.y + 16;
    if (this.sprite.depth !== newDepth) {
      this.sprite.setDepth(newDepth);
    }
  }

  setPosition(x, y, smooth = false) {
    if (!smooth) {
      this.sprite.setPosition(x, y);
      if (this.nameText) this.nameText.setPosition(Math.floor(x - 16), Math.floor(y - 25));
      if (this.sprite.body) this.sprite.body.reset(x, y);
      this._targetPosition.x = x;
      this._targetPosition.y = y;
      if (this.chat && this.chat.needsUpdate) this.chat.update();
      return;
    }

    this._targetPosition.x = x;
    this._targetPosition.y = y;
    
    const dx = x - this.sprite.x;
    const dy = y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 200) {
      this.sprite.setPosition(x, y);
      if (this.sprite.body) this.sprite.body.reset(x, y);
      if (this.nameText) this.nameText.setPosition(Math.floor(x - 16), Math.floor(y - 25));
      return;
    }
    
    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      y: y,
      duration: this._smoothDuration,
      ease: 'Linear',
      onUpdate: () => {
        if (this.sprite.body) {
          this.sprite.body.reset(this.sprite.x, this.sprite.y);
        }
        if (this.nameText) {
          this.nameText.setPosition(Math.floor(this.sprite.x - 16), Math.floor(this.sprite.y - 25));
        }
      },
      onComplete: () => {
        if (this.sprite.body) {
          this.sprite.body.reset(x, y);
        }
      }
    });
  }

  setSmoothDuration(ms) {
    this._smoothDuration = Math.max(0, ms | 0);
  }

  say(message, isCommandResponse) {
    return this.chat.say(message, isCommandResponse, estimateReadTime(message));
  }

  destroy() {
    if (this._positionTween) {
      try { this._positionTween.stop(); } catch (e) {}
      this._positionTween = null;
    }

    if (this.chat) {
      try { this.chat.destroy(); } catch (e) {}
      this.chat = null;
    }

    if (this.sprite) {
      try { this.sprite.destroy(); } catch (e) {}
      this.sprite = null;
    }
    if (this.nameText) {
      try { this.nameText.destroy(); } catch (e) {}
      this.nameText = null;
    }

    this.scene = null;
  }
}
