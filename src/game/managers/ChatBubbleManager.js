import HawkEngine from '../../../dist/engine/main.js';

export default class ChatBubbleManager {
  constructor(scene, getXFn, getYFn, options = {}) {
    this.scene = scene;
    this.getX = getXFn;
    this.getY = getYFn;

    this._bubbles = [];
    this._bubblePaddingX = options.bubblePaddingX ?? 6;
    this._bubblePaddingY = options.bubblePaddingY ?? 4;
    this._bubbleSeparation = options.bubbleSeparation ?? 4;
    this._bubbleDuration = options.bubbleDuration ?? 5000;
    this._bubbleMaxWidth = options.bubbleMaxWidth ?? 200;
    this._bubbleLimit = options.bubbleLimit ?? 5;
    this.bubblePosFPlayer = options.bubblePosFPlayer ?? 40;

    this._delayedCalls = new Set();

    this._typingBubble = null;
    this._typingTween = null;
    this._typingDelayedCall = null;
  }

  _wrapAndTruncateByWords(text, style, maxWidth, maxLines = 10) {
    if (!text) return '';
    const tmp = this.scene.add.bitmapText(0, 0, 'hawkpixelated', '', parseInt(style.fontSize, 10) || 16, HawkEngine.GameObjects.BitmapText.ALIGN_LEFT).setDepth(10000001);
    tmp.setOrigin(0, 0);

    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    const pushLine = (line) => {
      lines.push(line);
      currentLine = '';
    };

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const testLine = currentLine ? (currentLine + ' ' + w) : w;
      tmp.setText(testLine);
      const b = tmp.getBounds();
      if (b.width <= maxWidth) {
        currentLine = testLine;
      } else {
        tmp.setText(w);
        const wb = tmp.getBounds();
        if (wb.width > maxWidth) {
          let partial = '';
          for (let c = 0; c < w.length; c++) {
            const tCandidate = partial + w[c];
            tmp.setText(tCandidate);
            if (tmp.getBounds().width > maxWidth) break;
            partial = tCandidate;
          }
          if (currentLine) pushLine(currentLine);
          if (partial.length) {
            pushLine(partial);
          }
          const remaining = w.slice(partial.length);
          if (remaining.length) {
            currentLine = remaining;
          } else {
            currentLine = '';
          }
        } else {
          if (currentLine) {
            pushLine(currentLine);
          }
          currentLine = w;
        }
      }

      if (lines.length >= maxLines) {
        break;
      }
    }

    if (currentLine) pushLine(currentLine);

    if (lines.length > maxLines) {
      lines.length = maxLines;
    }

    let reconstructed = lines.join('\n');
    tmp.setText(reconstructed);
    let finalBounds = tmp.getBounds();
    const consumedWordsCount = (() => {
      if (!reconstructed) return 0;
      const used = reconstructed.replace(/\n/g, ' ').trim();
      return used ? used.split(/\s+/).length : 0;
    })();
    if (consumedWordsCount < words.length) {
      let last = lines[lines.length - 1] || '';
      tmp.setText(last + '...');
      while (tmp.getBounds().width > maxWidth && last.length > 0) {
        const parts = last.split(/\s+/);
        parts.pop();
        last = parts.join(' ');
        tmp.setText(last + '...');
        if (parts.length === 0) break;
      }
      if (tmp.getBounds().width > maxWidth) {
        let lastChars = last;
        while (lastChars.length > 0) {
          lastChars = lastChars.slice(0, -1);
          tmp.setText(lastChars + '...');
          if (tmp.getBounds().width <= maxWidth) {
            last = lastChars;
            break;
          }
        }
      }
      lines[lines.length - 1] = (last.trim() ? last.trim() + '...' : '...');
    }

    const result = lines.join('\n');
    tmp.destroy();
    return result;
  }

  say(message, isCommand = false, duration = undefined) {
    if (!message) return;

    const useDuration = typeof duration === 'number' && duration >= 0 ? duration : this._bubbleDuration;

    if (this._bubbles.length >= this._bubbleLimit) {
      const oldest = this._bubbles.shift();
      if (oldest) {
        if (oldest.container) {
          this.scene.tweens.add({
            targets: [oldest.container],
            alpha: { from: 1, to: 0 },
            duration: 150,
            onComplete: () => {
              if (!oldest.container.destroyed) oldest.container.destroy();
            }
          });
        }
        if (oldest._delayedCall && !oldest._delayedCall.hasDispatched) {
          try { oldest._delayedCall.remove(false); } catch (e) {}
        }
      }
      this._updateBubbleStack();
    }

    const textStyle = { fontFamily: 'Hawk', fontSize: '16px', color: (!isCommand ? '#aaaaaa' : 'yellow') };

    const finalText = this._wrapAndTruncateByWords(message, textStyle, this._bubbleMaxWidth);

    const tmpText = this.scene.add.bitmapText(0, 0, 'hawkpixelated', finalText, parseInt(textStyle.fontSize, 10) || 16, HawkEngine.GameObjects.BitmapText.ALIGN_LEFT).setDepth(10000001);
    tmpText.setOrigin(0, 0);

    const bounds = tmpText.getBounds();
    const textWidth = Math.ceil(bounds.width);
    const textHeight = Math.ceil(bounds.height);

    const bgWidth = textWidth + this._bubblePaddingX * 2;
    const bgHeight = textHeight + this._bubblePaddingY * 2;

    const container = this.scene.add.container(0, 0).setDepth(10000002);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    const cRadius = 6;
    bg.fillRoundedRect(0, 0, bgWidth, bgHeight, cRadius);

    const msgText = this.scene.add.bitmapText(this._bubblePaddingX, this._bubblePaddingY, 'hawkpixelated', finalText, parseInt(textStyle.fontSize, 10) || 16, HawkEngine.GameObjects.BitmapText.ALIGN_LEFT).setDepth(10000003);
    msgText.setOrigin(0, 0);
    msgText.setCharacterTint(0, -1, true, 0x808080);
    //msgText.setWordWrapWidth(this._bubbleMaxWidth, true);

    const cloud = this.scene.add.graphics();
    cloud.fillStyle(0x000000, 0.6);

    container.add([bg, msgText, cloud]);

    const stackIndex = this._bubbles.length;
    const spriteX = Math.round(this.getX());
    const spriteY = Math.round(this.getY());
    const baseX = Math.round(spriteX - Math.floor(bgWidth / 2));
    const baseY = Math.round(spriteY - this.bubblePosFPlayer - (bgHeight + this._bubbleSeparation) * stackIndex - bgHeight);
    container.x = Math.floor(baseX);
    container.y = Math.floor(baseY);

    const bubble = {
      container,
      bg,
      text: msgText,
      cloud,
      width: bgWidth,
      height: bgHeight,
      createdAt: Date.now(),
      _delayedCall: null
    };

    this._bubbles.push(bubble);
    this._updateBubbleStack();

    tmpText.destroy();

    this._clampBubbleToCameraAndPoint(bubble);

    const delayed = this.scene.time.delayedCall(useDuration, () => {
      this._removeBubble(bubble);
      this._delayedCalls.delete(delayed);
    });
    bubble._delayedCall = delayed;
    this._delayedCalls.add(delayed);

    return bubble;
  }

  setTyping(on, duration = undefined) {
    if (on) {
      if (this._typingBubble) {
        if (this._typingDelayedCall) {
          try { this._typingDelayedCall.remove(false); } catch (e) {}
          this._delayedCalls.delete(this._typingDelayedCall);
          this._typingDelayedCall = null;
        }
        if (typeof duration === 'number' && duration >= 0) {
          const dc = this.scene.time.delayedCall(duration, () => { this.setTyping(false); });
          this._typingDelayedCall = dc;
          this._delayedCalls.add(dc);
        }
        return;
      }

      const textStyle = { fontFamily: 'Hawk', fontSize: '16px', color: '#aaaaaa' };
      const message = '...';
      const tmpText = this.scene.add.bitmapText(0, 0, 'hawkpixelated', message, parseInt(textStyle.fontSize, 10) || 16, HawkEngine.GameObjects.BitmapText.ALIGN_LEFT).setDepth(10000001);
      tmpText.setOrigin(0, 0);
      
      const bounds = tmpText.getBounds();
      const textWidth = Math.ceil(bounds.width);
      const textHeight = Math.ceil(bounds.height);
      tmpText.destroy();

      const bgWidth = textWidth + this._bubblePaddingX * 2;
      const bgHeight = textHeight + this._bubblePaddingY * 2;

      const container = this.scene.add.container(0, 0).setDepth(10000010);

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x000000, 0.6);
      const cRadius = 6;
      bg.fillRoundedRect(0, 0, bgWidth, bgHeight, cRadius);

      const dotAreaX = this._bubblePaddingX;
      const dotAreaY = this._bubblePaddingY;
      const availableW = bgWidth - this._bubblePaddingX * 2;
      const centerY = dotAreaY;

      const dotCount = 3;
      const spacing = 2;

      const randGrayBetween = () => {
        const v = Math.floor(0xAA + Math.random() * (0xFF - 0xAA + 1));
        const hexStr = v.toString(16).padStart(2, '0');
        return `#${hexStr}${hexStr}${hexStr}`;
      };

      const dots = [];
      for (let i = 0; i < dotCount; i++) {
        const color = randGrayBetween();
        const dotText = this.scene.add.bitmapText(0, 0, 'hawkpixelated', '.', parseInt(textStyle.fontSize, 10) || 16, HawkEngine.GameObjects.BitmapText.ALIGN_LEFT).setDepth(10000011 + i);
        dotText.setCharacterTint(0, -1, true, 0xFFFFFF);
        dotText.setOrigin(0.5, 0.5);
        const x = (spacing * (i + 1)) + dotAreaX - 0.5;
        const y = dotAreaY + Math.floor(textHeight / 2);
        dotText.x = x;
        dotText.y = y;

        dotText.setScale(1, 1);
        dotText.setAlpha(1);
        container.add(dotText);
        dots.push({ text: dotText });
      }

      const cloud = this.scene.add.graphics();
      cloud.fillStyle(0x000000, 0.6);
      container.add([bg, cloud]);
      container.sendToBack(bg);

      const spriteX = Math.round(this.getX());
      const spriteY = Math.round(this.getY());
      const baseX = Math.round(spriteX - Math.floor(bgWidth / 2));
      const baseY = Math.round(spriteY - this.bubblePosFPlayer - bgHeight);
      container.x = Math.floor(baseX);
      container.y = Math.floor(baseY);

      const typingBubble = {
        container,
        bg,
        dots,
        cloud,
        width: bgWidth,
        height: bgHeight
      };

      this._typingBubble = typingBubble;

      this._clampBubbleToCameraAndPoint(typingBubble);

      const tweens = [];
      const pulseDuration = 500;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const tw = this.scene.tweens.add({
          targets: d.text,
          alpha: { from: 0.4, to: 1 },
          ease: 'Sine.easeInOut',
          duration: pulseDuration,
          yoyo: true,
          repeat: -1,
          delay: i * (pulseDuration / 3)
        });
        tweens.push(tw);
      }
      this._typingTween = { tweens };

      if (typeof duration === 'number' && duration >= 0) {
        const dc = this.scene.time.delayedCall(duration, () => { this.setTyping(false); });
        this._typingDelayedCall = dc;
        this._delayedCalls.add(dc);
      }

      this._updateBubbleStack();
      return;
    } else {
      if (!this._typingBubble) return;

      if (this._typingDelayedCall) {
        try { this._typingDelayedCall.remove(false); } catch (e) {}
        this._delayedCalls.delete(this._typingDelayedCall);
        this._typingDelayedCall = null;
      }

      if (this._typingTween && Array.isArray(this._typingTween.tweens)) {
        for (const tw of this._typingTween.tweens) {
          try { tw.remove(false); } catch (e) {}
        }
        this._typingTween = null;
      }

      const tb = this._typingBubble;
      try {
        this.scene.tweens.add({
          targets: [tb.container],
          alpha: { from: 1, to: 0 },
          duration: 120,
          onComplete: () => {
            if (tb.container && !tb.container.destroyed) tb.container.destroy();
          }
        });
      } catch (e) {
        if (tb.container && !tb.container.destroyed) tb.container.destroy();
      }

      this._typingBubble = null;
      this._updateBubbleStack();
      return;
    }
  }

  _clampBubbleToCameraAndPoint(bubble) {
    if (!this.scene.cameras || !this.scene.cameras.main) return;
    const cam = this.scene.cameras.main;
    const camLeft = cam.worldView.x;
    const camTop = cam.worldView.y;
    const camRight = cam.worldView.x + cam.worldView.width;
    const camBottom = cam.worldView.y + cam.worldView.height;

    let clampedX = bubble.container.x;
    if (clampedX < camLeft + 4) clampedX = Math.floor(camLeft + 4);
    if (clampedX + bubble.width > camRight - 4) clampedX = Math.floor(camRight - bubble.width - 4);
    bubble.container.x = clampedX;

    let clampedY = bubble.container.y;
    if (clampedY < camTop + 4) clampedY = Math.floor(camTop + 4);
    if (clampedY + bubble.height > camBottom - 4) clampedY = Math.floor(camBottom - bubble.height - 4);
    bubble.container.y = clampedY;

    this._drawCloudForBubble(bubble);
  }

  _drawCloudForBubble(bubble) {
    if (!bubble.cloud) return;
    const cloud = bubble.cloud;
    cloud.clear();
    cloud.fillStyle(0x000000, 0.6);

    const vWidth = 6;
    const vHeight = 6;
    const bubbleLeft = bubble.container.x;
    const spriteX = Math.round(this.getX());

    let centerX = spriteX - bubbleLeft;
    const margin = 6;
    centerX = Math.max(margin, Math.min(bubble.width - margin, centerX));

    const isTyping = this._typingBubble === bubble;

    const isBubbleAboveSprite = bubble.container.y + bubble.height <= this.getY() - 8;
    const triTopY = isBubbleAboveSprite ? bubble.height : -vHeight;
    const triBottomY = isBubbleAboveSprite ? bubble.height + vHeight : 0;

    const triLeftX = Math.floor(centerX - Math.floor(vWidth / 2));
    const triRightX = Math.floor(centerX + Math.ceil(vWidth / 2));

    cloud.beginPath();
    cloud.moveTo(triLeftX, triTopY);
    cloud.lineTo(triRightX, triTopY);
    cloud.lineTo(centerX, triBottomY);
    cloud.closePath();
    cloud.fillPath();

    if (!isTyping) {
      const lastNormal = this._bubbles.length ? this._bubbles[this._bubbles.length - 1] : null;
      if (lastNormal && lastNormal.cloud) {
        lastNormal.cloud.setVisible(lastNormal === bubble);
      }
    } else {
      cloud.setVisible(true);
    }
  }

  _repositionBubbles() {
    if (this._typingBubble) {
      const tb = this._typingBubble;
      const px = Math.round(this.getX());
      const py = Math.round(this.getY());
      const baseX = Math.round(px - Math.floor(tb.width / 2));
      const baseY = Math.round(py - this.bubblePosFPlayer - tb.height);
      tb.container.x = Math.floor(baseX);
      tb.container.y = Math.floor(baseY);
      this._clampBubbleToCameraAndPoint(tb);
    }

    if (!this._bubbles.length) return;
    const px = Math.round(this.getX());
    const py = Math.round(this.getY());
    for (let i = 0; i < this._bubbles.length; i++) {
      const b = this._bubbles[i];
      const bgW = b.width;
      const bgH = b.height;
      const stackIndex = i;
      const topOffsetCount = this._typingBubble ? 1 : 0;
      const baseX = Math.round(px - Math.floor(bgW / 2));
      const baseY = Math.round(py - this.bubblePosFPlayer - (bgH + this._bubbleSeparation) * (this._bubbles.length - 1 - stackIndex + topOffsetCount) - bgH);
      b.container.x = Math.floor(baseX);
      b.container.y = Math.floor(baseY);

      this._clampBubbleToCameraAndPoint(b);
    }
  }

  _updateBubbleStack() {
    if (this._typingBubble) {
      this._typingBubble.container.setDepth(10000020);
      if (this._typingBubble.cloud) this._typingBubble.cloud.setVisible(true);
    }

    for (let i = 0; i < this._bubbles.length; i++) {
      const b = this._bubbles[i];
      const depthBase = 10000002;
      b.container.setDepth(depthBase + i);
      if (b.cloud) {
        b.cloud.setVisible(!this._typingBubble && i === this._bubbles.length - 1);
      }
    }
    this._repositionBubbles();
  }

  _removeBubble(bubble) {
    const idx = this._bubbles.indexOf(bubble);
    if (idx === -1) return;

    if (bubble._delayedCall) {
      try { bubble._delayedCall.remove(false); } catch (e) {}
      this._delayedCalls.delete(bubble._delayedCall);
      bubble._delayedCall = null;
    }

    this.scene.tweens.add({
      targets: [bubble.container],
      alpha: { from: 1, to: 0 },
      duration: 200,
      onComplete: () => {
        if (bubble.container && !bubble.container.destroyed) bubble.container.destroy();
      }
    });
    this._bubbles.splice(idx, 1);
    this._updateBubbleStack();
  }

  destroy() {
    for (const d of this._delayedCalls) {
      try { d.remove(false); } catch (e) {}
    }
    this._delayedCalls.clear();

    if (this._typingDelayedCall) {
      try { this._typingDelayedCall.remove(false); } catch (e) {}
      this._typingDelayedCall = null;
    }
    if (this._typingTween) {
      try { this._typingTween.remove(false); } catch (e) {}
      this._typingTween = null;
    }
    if (this._typingBubble && this._typingBubble.container && !this._typingBubble.container.destroyed) {
      try {
        this._typingBubble.container.destroy();
      } catch (e) {}
      this._typingBubble = null;
    }

    for (let i = 0; i < this._bubbles.length; i++) {
      const b = this._bubbles[i];
      if (b && b._delayedCall) {
        try { b._delayedCall.remove(false); } catch (e) {}
        b._delayedCall = null;
      }
      if (b && b.container && !b.container.destroyed) {
        try {
          this.scene.tweens.add({
            targets: [b.container],
            alpha: { from: 1, to: 0 },
            duration: 100,
            onComplete: () => {
              if (b.container && !b.container.destroyed) b.container.destroy();
            }
          });
        } catch (e) {
          if (b.container && !b.container.destroyed) b.container.destroy();
        }
      }
    }
    this._bubbles = [];
    this.scene = null;
    this.getX = null;
    this.getY = null;
  }

  update() {
    this._repositionBubbles();
  }
}

