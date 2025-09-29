import ChatBubbleManager from '../managers/ChatBubbleManager.js';
import { estimateReadTime } from '../utils/Utils.js';

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

    this.nameText = scene.add.text(Math.floor(x - 16), Math.floor(y - 32), display_name || '', { fontFamily: 'Hawk', fontSize: '16px', color: '#ffffff' }).setDepth(10248);

    this._positionTween = null;
    this._smoothDuration = 100;

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
    const speed = 200;
    this.sprite.body.setVelocity(direction.x * speed, direction.y * speed);
    this.sprite.setDepth(this.sprite.y + 16);
    this.nameText.setPosition(Math.floor(this.sprite.x - Math.floor(this.sprite.width / 2)), Math.floor(this.sprite.y - 30));
  }

  setPosition(x, y, smooth = false) {
    if (this._positionTween) {
      this._positionTween.stop();
      this._positionTween = null;
    }

    const duration = smooth ? this._smoothDuration : 0;

    if (!duration) {
      this.sprite.setPosition(x, y);
      if (this.nameText) this.nameText.setPosition(Math.floor(x - 16), Math.floor(y - 25));
      if (this.sprite.body) this.sprite.body.reset(x, y);
      this.chat.update();
      return;
    }

    this._positionTween = this.scene.tweens.add({
      targets: [this.sprite, this.nameText],
      props: {
        x: { value: x, ease: 'Linear' },
        y: { value: (target) => (target === this.nameText ? y - 20 : y), ease: 'Linear' }
      },
      duration,
      onUpdate: () => {
        this.sprite.x = Math.round(this.sprite.x);
        this.sprite.y = Math.round(this.sprite.y);
        this.nameText.x = Math.round(this.nameText.x);
        this.nameText.y = Math.round(this.nameText.y);
        this.chat.update();
      },
      onComplete: () => {
        this.sprite.setPosition(x, y);
        if (this.nameText) this.nameText.setPosition(Math.floor(x - 16), Math.floor(y - 20));
        if (this.sprite.body) this.sprite.body.reset(x, y);
        this._positionTween = null;
        this.chat.update();
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
