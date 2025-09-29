export default class ConnectingOverlay {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.textString = opts.text || 'Connecting...';
    this.fontSize = opts.fontSize || 32;
    this.fontFamily = opts.fontFamily || 'Hawk';
    this.color = opts.color || '#ffffff';
    this.depth = typeof opts.depth === 'number' ? opts.depth : 10248;

    this.container = null;
    this.visible = false;
  }

  _createElements() {
    if (this.container) return;

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x222222)
      .setOrigin(0, 0);

    const style = {
      fontFamily: this.fontFamily,
      fontSize: `${this.fontSize}px`,
      color: this.color
    };
    const textX = Math.floor(width / 2);
    const textY = Math.floor(height / 2);
    const text = this.scene.add.text(textX, textY, this.textString, style)
      .setOrigin(0.5, 0.5);

    this.container = this.scene.add.container(0, 0, [bg, text])
      .setDepth(this.depth)
      .setVisible(false);

    this._bg = bg;
    this._text = text;

    this._tween = this.scene.tweens.add({
      targets: this._text,
      alpha: { from: 1, to: 0.4 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      paused: true
    });

    this._resizeHandler = () => {
      const w = this.scene.scale.width;
      const h = this.scene.scale.height;
      this._bg.setSize(w, h);
      this._text.setPosition(Math.floor(w / 2), Math.floor(h / 2));
    };

    if (this.scene.scale && this.scene.scale.on) {
      this.scene.scale.on('resize', this._resizeHandler);
    }
  }

  show() {
    this._createElements();
    if (this.container && !this.visible) {
      this.container.setVisible(true);
      if (this._tween) this._tween.play();
      this.visible = true;
    }
  }

  remove() {
    if (!this.container) return;
    if (this._tween) {
      this._tween.stop();
      this._tween = null;
    }
    if (this.scene.scale && this.scene.scale.off && this._resizeHandler) {
      this.scene.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    this.container.removeAll(true);
    this.container.destroy();
    this.container = null;
    this._bg = null;
    this._text = null;
    this.visible = false;
  }
}
