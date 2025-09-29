import * as Phaser from 'phaser';
import Options from '../utils/Options.js';

const MAX_LIGHTS = 64;

export default class LightManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.game = scene.sys.game;
    this.totalMinutes = options.timeMinutes ?? 24;
    this.totalSeconds = this.totalMinutes * 60;
    this.running = options.startRunning ?? true;
    this.timeSeconds = (options.startAtMinutes ?? 12) * 60;
    this.nightColor = options.nightColor ?? 0x02061a;
    this.nightAlpha = options.nightAlpha ?? 0.7;
    const Tmin = this.totalMinutes;
    this.phasesMinutes = options.phasesMinutes ?? [
      { start: 0,    color: this.nightColor, alpha: this.nightAlpha },
      { start: 4,    color: this.nightColor, alpha: this.nightAlpha },
      { start: 6,    color: 0xffffff,        alpha: 0 },
      { start: 16,   color: 0xffffff,        alpha: 0 },
      { start: 18,   color: this.nightColor, alpha: this.nightAlpha },
      { start: 20,   color: this.nightColor, alpha: this.nightAlpha }
    ];
    this.phases = (this.phasesMinutes.slice()).map((p, idx) => ({
      start: Phaser.Math.Clamp((p.start ?? 0) * 60, 0, this.totalSeconds),
      color: (typeof p.color !== 'undefined') ? (p.color >>> 0) : undefined,
      alpha: (typeof p.alpha !== 'undefined') ? Phaser.Math.Clamp(p.alpha, 0, 1) : undefined,
      index: idx
    })).sort((a, b) => a.start - b.start);
    this.lights = [];
    this._created = false;
    this._rtKey = '__light_manager_rt';
    this._rt = null;
    this._lightSprite = null;
    this._quad = null;
    this._camera = null;
    this._onResize = this._onResize.bind(this);
    this._lastPhase = null;
    this._phaseCallbacks = [];
    this._timeCallbacks = [];
    this.overlayEvaluator = options.overlayEvaluator ?? this._defaultOverlayEvaluator.bind(this);
  }

  create(radialTextureKey = 'lightRadial', mask = 'imageMask') {
    if (this._created) return;
    const cam = this.scene.cameras.main;
    this._camera = cam;
    const w = cam.width;
    const h = cam.height;
    const rtKey = `__light_manager_rt_${Date.now()}`;
    if (this.scene.textures.exists(this._rtKey)) {
      try { this.scene.textures.remove(this._rtKey); } catch (e) {}
    }
    this._rtKey = rtKey;
    this._rt = this.scene.make.renderTexture({ width: w, height: h, key: rtKey });
    this._quad = this.scene.add.image(0, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(5000);
    if (this._rt && this._rt.texture) this._quad.setTexture(this._rt.texture);
    else this._quad.setTexture(rtKey);
    this._quad.setDisplaySize(w, h);
    if (!this.scene.textures.exists(radialTextureKey)) {
      console.warn(`LightManager: radial texture "${radialTextureKey}" not found.`);
    }
    this._lightSprite = this.scene.add.image(0, 0, radialTextureKey).setVisible(false).setOrigin(0.5);
    this._maskKey = mask;
    this.scene.scale.on('resize', this._onResize);
    this._created = true;
  }

  static _lerpColor(cA, cB, t) {
    const a = Phaser.Display.Color.IntegerToColor(cA >>> 0);
    const b = Phaser.Display.Color.IntegerToColor(cB >>> 0);
    const r = Math.round(Phaser.Math.Linear(a.red, b.red, t));
    const g = Math.round(Phaser.Math.Linear(a.green, b.green, t));
    const bl = Math.round(Phaser.Math.Linear(a.blue, b.blue, t));
    return Phaser.Display.Color.GetColor(r, g, bl);
  }

  _defaultOverlayEvaluator(nowSec) {
    const t = ((nowSec % this.totalSeconds) + this.totalSeconds) % this.totalSeconds;
    let idx = -1;
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (t >= this.phases[i].start) { idx = i; break; }
    }
    if (idx === -1) idx = this.phases.length - 1;
    const phase = this.phases[idx];
    const nextIdx = (idx + 1) % this.phases.length;
    const nextPhase = this.phases[nextIdx];
    let duration = nextPhase.start - phase.start;
    if (duration <= 0) duration += this.totalSeconds;
    let elapsed = t - phase.start;
    if (elapsed < 0) elapsed += this.totalSeconds;
    const progress = duration > 0 ? Phaser.Math.Clamp(elapsed / duration, 0, 1) : 0;
    const curColor = (typeof phase.color !== 'undefined') ? phase.color >>> 0 : this.nightColor;
    const curAlpha = (typeof phase.alpha !== 'undefined') ? phase.alpha : this.nightAlpha;
    const nextColor = (typeof nextPhase.color !== 'undefined') ? nextPhase.color >>> 0 : this.nightColor;
    const nextAlpha = (typeof nextPhase.alpha !== 'undefined') ? nextPhase.alpha : this.nightAlpha;
    const color = LightManager._lerpColor(curColor, nextColor, progress);
    const alpha = Phaser.Math.Clamp(Phaser.Math.Linear(curAlpha, nextAlpha, progress), 0, 1);
    return {
      color,
      alpha,
      progress,
      phaseIndex: idx
    };
  }

update(time, delta) {
  if (!this._created) return;
  const dt = (delta ?? 0) / 1000;
  if (this.running) {
    this.timeSeconds += dt;
    if (this.timeSeconds >= this.totalSeconds) this.timeSeconds -= this.totalSeconds;
    if (this.timeSeconds < 0) this.timeSeconds = (this.timeSeconds % this.totalSeconds + this.totalSeconds) % this.totalSeconds;
    this._timeCallbacks.forEach(cb => { try { cb(this); } catch (e) {} });
  }

  const overlay = this.overlayEvaluator(this.timeSeconds);
  if (overlay && overlay.phaseIndex !== this._lastPhase) {
    this._lastPhase = overlay.phaseIndex;
    this._phaseCallbacks.forEach(cb => { try { cb(overlay, overlay.phaseIndex); } catch (e) {} });
  }

  const cam = this._camera || this.scene.cameras.main;
  const w = cam.width, h = cam.height;
  if (!this._rt || !this._rt.texture) {
    console.warn('LightManager.update: missing RenderTexture');
    return;
  }
  if (!this._quad) return;

  // Clear & fill night overlay
  this._rt.clear();
  const nc = Phaser.Display.Color.IntegerToColor(overlay.color ?? this.nightColor);
  const nightFill = Phaser.Display.Color.GetColor(nc.red, nc.green, nc.blue);
  const nightAlpha = Phaser.Math.Clamp(overlay.alpha ?? this.nightAlpha, 0, 1);
  this._rt.fill(nightFill, nightAlpha);

  // Precompute texture source width once
  let srcWidth = 1;
  if (this._lightSprite && this._lightSprite.texture) {
    try {
      const tex = this._lightSprite.texture;
      const src = (tex.getSourceImage && tex.getSourceImage()) || (this.scene.textures.exists(tex.key) && this.scene.textures.get(tex.key).getSourceImage());
      if (src && src.width) srcWidth = src.width;
    } catch (e) { srcWidth = 1; }
  }

  const lightCount = Math.min(this.lights.length, MAX_LIGHTS);

  // Camera world offset (robust for different viewports)
  const camX = (cam.worldView && typeof cam.worldView.x === 'number') ? cam.worldView.x : (cam.scrollX || 0);
  const camY = (cam.worldView && typeof cam.worldView.y === 'number') ? cam.worldView.y : (cam.scrollY || 0);
  // cam.x/cam.y are the camera's viewport position in screen space (useful when viewport not at 0,0)
  const viewOffsetX = (typeof cam.x === 'number') ? cam.x : 0;
  const viewOffsetY = (typeof cam.y === 'number') ? cam.y : 0;

  for (let i = 0; i < lightCount; i++) {
    const L = this.lights[i];
    if (!L) continue;

    // world => screen transform (keeps radius in world units then scaled by cam.zoom)
    const sx = (L.x - camX) + viewOffsetX;
    const sy = (L.y - camY) + viewOffsetY;
    const alpha = Phaser.Math.Clamp(L.alpha * (L.intensity ?? 1), 0, 1);

    if (!this._lightSprite || !this._lightSprite.texture) continue;

    this._lightSprite.setPosition(sx, sy).setAlpha(alpha).setTint(L.color);
    this._rt.draw(this._lightSprite);
  }

  // Ensure quad uses current RT texture and size
  if (this._rt && this._rt.texture && this._quad.texture !== this._rt.texture) {
    this._quad.setTexture(this._rt.texture);
    this._quad.setDisplaySize(w, h);
  } else {
    // keep display size in case camera resized
    this._quad.setDisplaySize(w, h);
  }
  this._quad.setBlendMode(Phaser.BlendModes.MULTIPLY);
}


  addLight(x, y, radius = 128, color = 0xffffff, alpha = 1, intensity = 1, mask = null) {
    if (this.lights.length >= MAX_LIGHTS) return null;
    const light = {
      x: x ?? 0,
      y: y ?? 0,
      radius: radius ?? 128,
      color: color >>> 0,
      alpha: Phaser.Math.Clamp(alpha, 0, 1),
      intensity: intensity ?? 1,
      mask: mask ?? this._maskKey
    };
    this.lights.push(light);
    return light;
  }

  removeLightObj(lightObj) {
    const i = this.lights.indexOf(lightObj);
    if (i !== -1) this.lights.splice(i, 1);
  }

  clearLights() { this.lights.length = 0; }
  setNightAlpha(a) { this.nightAlpha = Phaser.Math.Clamp(a, 0, 1); }
  setNightColor(c) { this.nightColor = c >>> 0; }

  start() { this.running = true; }
  pause() { this.running = false; }
  reset() { this.timeSeconds = 0; }
  setTime(sec) { this.timeSeconds = ((sec % this.totalSeconds) + this.totalSeconds) % this.totalSeconds; }
  getTime() { return this.timeSeconds; }
  getTimeF() {
    const use12 = Options.get("use12hFormat");

    let hours = Math.floor(this.timeSeconds / 60);
    const minutes = Math.floor(this.timeSeconds % 60);

    if (use12) {
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return hours + ":" + String(minutes).padStart(2, "0") + " " + period;
    } else {
      return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
    }
  }
  setTimeMinutes(min) { this.setTime(min * 60); }
  getTimeMinutes() { return this.timeSeconds / 60; }

  onPhaseChange(cb) { if (typeof cb === 'function') this._phaseCallbacks.push(cb); }
  onTimeChange(cb) { if (typeof cb === 'function') this._timeCallbacks.push(cb); }

  _onResize() {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;
    if (!this._rt) return;
    this._rt.destroy();
    this._rt = this.scene.make.renderTexture({ width: w, height: h, key: this._rtKey });
    if (this._quad) {
      if (this._rt && this._rt.texture) this._quad.setTexture(this._rt.texture);
      else this._quad.setTexture(this._rtKey);
      this._quad.setDisplaySize(w, h);
    }
  }

  destroy() {
    if (this._quad) { this._quad.destroy(); this._quad = null; }
    if (this._lightSprite) { this._lightSprite.destroy(); this._lightSprite = null; }
    if (this._rt) { this._rt.destroy(); this._rt = null; }
    this.scene.scale.off('resize', this._onResize);
    this._created = false;
  }
}
