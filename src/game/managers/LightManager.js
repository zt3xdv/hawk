import HawkEngine from '../../../dist/engine/main.js';
import Options from '../utils/Options.js';

const MAX_LIGHTS = 64;
const LIGHT_MERGE_DISTANCE = 150;

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
      start: HawkEngine.Math.Clamp((p.start ?? 0) * 60, 0, this.totalSeconds),
      color: (typeof p.color !== 'undefined') ? (p.color >>> 0) : undefined,
      alpha: (typeof p.alpha !== 'undefined') ? HawkEngine.Math.Clamp(p.alpha, 0, 1) : undefined,
      index: idx
    })).sort((a, b) => a.start - b.start);
    this.lights = [];
    this._created = false;
    this._rtKey = '__light_manager_rt';
    this._rt = null;
    this._quad = null;
    this._camera = null;
    this._onResize = this._onResize.bind(this);
    this._lastPhase = null;
    this._phaseCallbacks = [];
    this._timeCallbacks = [];
    this.overlayEvaluator = options.overlayEvaluator ?? this._defaultOverlayEvaluator.bind(this);
    
    this._glowPipeline = null;
    this._useLowQuality = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this._mergedLights = [];
    this._lastCamX = 0;
    this._lastCamY = 0;
    this._updateCounter = 0;
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
    
    const quality = this._useLowQuality ? 0.5 : 1;
    this._rt = this.scene.make.renderTexture({ 
      width: Math.floor(w * quality), 
      height: Math.floor(h * quality), 
      key: rtKey 
    });
    
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
    
    try {
      const PostFXPipeline = HawkEngine.Renderer?.WebGL?.Pipelines?.PostFXPipeline;
      if (PostFXPipeline && this.scene.renderer.pipelines) {
        this._setupGlowPipeline();
      }
    } catch (e) {
      console.warn('LightManager: Could not setup glow pipeline', e);
    }
    
    this._created = true;
  }

  _setupGlowPipeline() {
    try {
      const fragmentShader = `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform float uGlowStrength;
        varying vec2 outTexCoord;
        
        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec4 sum = vec4(0.0);
          float blur = uGlowStrength / uResolution.x;
          
          sum += texture2D(uMainSampler, vec2(outTexCoord.x - 4.0 * blur, outTexCoord.y)) * 0.05;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x - 3.0 * blur, outTexCoord.y)) * 0.09;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x - 2.0 * blur, outTexCoord.y)) * 0.12;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x - blur, outTexCoord.y)) * 0.15;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x, outTexCoord.y)) * 0.16;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x + blur, outTexCoord.y)) * 0.15;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x + 2.0 * blur, outTexCoord.y)) * 0.12;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x + 3.0 * blur, outTexCoord.y)) * 0.09;
          sum += texture2D(uMainSampler, vec2(outTexCoord.x + 4.0 * blur, outTexCoord.y)) * 0.05;
          
          gl_FragColor = mix(color, sum, 0.8);
        }
      `;
      
      if (this._quad && this._quad.setPostPipeline) {
        const pipeline = this.scene.renderer.pipelines.addPostPipeline('LightGlow', fragmentShader);
        if (pipeline) {
          this._glowPipeline = pipeline;
          this._quad.setPostPipeline(pipeline);
        }
      }
    } catch (e) {
      console.warn('LightManager: Glow pipeline setup failed', e);
    }
  }

  static _lerpColor(cA, cB, t) {
    const a = HawkEngine.Display.Color.IntegerToColor(cA >>> 0);
    const b = HawkEngine.Display.Color.IntegerToColor(cB >>> 0);
    const r = Math.round(HawkEngine.Math.Linear(a.red, b.red, t));
    const g = Math.round(HawkEngine.Math.Linear(a.green, b.green, t));
    const bl = Math.round(HawkEngine.Math.Linear(a.blue, b.blue, t));
    return HawkEngine.Display.Color.GetColor(r, g, bl);
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
    const progress = duration > 0 ? HawkEngine.Math.Clamp(elapsed / duration, 0, 1) : 0;
    const curColor = (typeof phase.color !== 'undefined') ? phase.color >>> 0 : this.nightColor;
    const curAlpha = (typeof phase.alpha !== 'undefined') ? phase.alpha : this.nightAlpha;
    const nextColor = (typeof nextPhase.color !== 'undefined') ? nextPhase.color >>> 0 : this.nightColor;
    const nextAlpha = (typeof nextPhase.alpha !== 'undefined') ? nextPhase.alpha : this.nightAlpha;
    const color = LightManager._lerpColor(curColor, nextColor, progress);
    const alpha = HawkEngine.Math.Clamp(HawkEngine.Math.Linear(curAlpha, nextAlpha, progress), 0, 1);
    return {
      color,
      alpha,
      progress,
      phaseIndex: idx
    };
  }

  _mergeLights(camX, camY, camW, camH) {
    this._mergedLights = [];
    const processed = new Set();
    
    const visibleLights = this.lights.filter(light => {
      const sx = light.x - camX;
      const sy = light.y - camY;
      const r = light.radius || 128;
      return sx + r >= -50 && sx - r <= camW + 50 && 
             sy + r >= -50 && sy - r <= camH + 50;
    });
    
    for (let i = 0; i < visibleLights.length; i++) {
      if (processed.has(i)) continue;
      
      const lightA = visibleLights[i];
      const cluster = [lightA];
      processed.add(i);
      
      for (let j = i + 1; j < visibleLights.length; j++) {
        if (processed.has(j)) continue;
        
        const lightB = visibleLights[j];
        const dx = lightA.x - lightB.x;
        const dy = lightA.y - lightB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < LIGHT_MERGE_DISTANCE) {
          cluster.push(lightB);
          processed.add(j);
        }
      }
      
      if (cluster.length === 1) {
        this._mergedLights.push(lightA);
      } else {
        let totalX = 0, totalY = 0, totalWeight = 0;
        let maxRadius = 0;
        let blendedColor = { r: 0, g: 0, b: 0 };
        let totalAlpha = 0;
        let totalIntensity = 0;
        
        cluster.forEach(light => {
          const weight = (light.intensity || 1) * (light.alpha || 1);
          totalX += light.x * weight;
          totalY += light.y * weight;
          totalWeight += weight;
          maxRadius = Math.max(maxRadius, light.radius || 128);
          
          const color = HawkEngine.Display.Color.IntegerToColor(light.color || 0xffffff);
          blendedColor.r += color.red * weight;
          blendedColor.g += color.green * weight;
          blendedColor.b += color.blue * weight;
          
          totalAlpha += light.alpha || 1;
          totalIntensity += light.intensity || 1;
        });
        
        if (totalWeight > 0) {
          this._mergedLights.push({
            x: totalX / totalWeight,
            y: totalY / totalWeight,
            radius: maxRadius * 1.2,
            color: HawkEngine.Display.Color.GetColor(
              Math.round(blendedColor.r / totalWeight),
              Math.round(blendedColor.g / totalWeight),
              Math.round(blendedColor.b / totalWeight)
            ),
            alpha: Math.min(totalAlpha / cluster.length * 1.2, 1),
            intensity: totalIntensity / cluster.length,
            mask: lightA.mask
          });
        }
      }
    }
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

    const camX = (cam.worldView && typeof cam.worldView.x === 'number') ? cam.worldView.x : (cam.scrollX || 0);
    const camY = (cam.worldView && typeof cam.worldView.y === 'number') ? cam.worldView.y : (cam.scrollY || 0);
    
    this._updateCounter++;
    const shouldMerge = this._updateCounter % (this._useLowQuality ? 3 : 2) === 0;
    
    if (shouldMerge || Math.abs(camX - this._lastCamX) > 50 || Math.abs(camY - this._lastCamY) > 50) {
      this._mergeLights(camX, camY, w, h);
      this._lastCamX = camX;
      this._lastCamY = camY;
    }

    this._rt.clear();
    const nc = HawkEngine.Display.Color.IntegerToColor(overlay.color ?? this.nightColor);
    const nightFill = HawkEngine.Display.Color.GetColor(nc.red, nc.green, nc.blue);
    const nightAlpha = HawkEngine.Math.Clamp(overlay.alpha ?? this.nightAlpha, 0, 1);
    this._rt.fill(nightFill, nightAlpha);

    const viewOffsetX = (typeof cam.x === 'number') ? cam.x : 0;
    const viewOffsetY = (typeof cam.y === 'number') ? cam.y : 0;

    const lightsToRender = this._mergedLights;
    const quality = this._useLowQuality ? 0.5 : 1;

    for (let i = 0; i < lightsToRender.length; i++) {
      const L = lightsToRender[i];
      if (!L) continue;

      const sx = ((L.x - camX) + viewOffsetX) * quality;
      const sy = ((L.y - camY) + viewOffsetY) * quality;
      const alpha = HawkEngine.Math.Clamp(L.alpha * (L.intensity ?? 1), 0, 1);

      if (!this._lightSprite || !this._lightSprite.texture) continue;

      const scale = (L.radius / 64) * quality;
      this._lightSprite.setPosition(sx, sy)
        .setAlpha(alpha)
        .setTint(L.color)
        .setScale(scale);
      this._rt.draw(this._lightSprite);
    }

    if (this._rt && this._rt.texture && this._quad.texture !== this._rt.texture) {
      this._quad.setTexture(this._rt.texture);
      this._quad.setDisplaySize(w, h);
    } else {
      this._quad.setDisplaySize(w, h);
    }
    
    this._quad.setBlendMode(HawkEngine.BlendModes.MULTIPLY);
    
    if (this._glowPipeline && this._glowPipeline.set2f && this._glowPipeline.set1f) {
      try {
        this._glowPipeline.set2f('uResolution', w, h);
        this._glowPipeline.set1f('uGlowStrength', this._useLowQuality ? 3.0 : 5.0);
      } catch (e) {}
    }
  }

  addLight(x, y, radius = 128, color = 0xffffff, alpha = 1, intensity = 1, mask = null) {
    if (this.lights.length >= MAX_LIGHTS) return null;
    const light = {
      x: x ?? 0,
      y: y ?? 0,
      radius: radius ?? 128,
      color: color >>> 0,
      alpha: HawkEngine.Math.Clamp(alpha, 0, 1),
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

  clearLights() { 
    this.lights.length = 0;
    this._mergedLights = [];
  }
  
  setNightAlpha(a) { this.nightAlpha = HawkEngine.Math.Clamp(a, 0, 1); }
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
    
    const quality = this._useLowQuality ? 0.5 : 1;
    this._rt = this.scene.make.renderTexture({ 
      width: Math.floor(w * quality), 
      height: Math.floor(h * quality), 
      key: this._rtKey 
    });
    
    if (this._quad) {
      if (this._rt && this._rt.texture) this._quad.setTexture(this._rt.texture);
      else this._quad.setTexture(this._rtKey);
      this._quad.setDisplaySize(w, h);
    }
  }

  destroy() {
    if (this._quad) { 
      if (this._glowPipeline) {
        try { this._quad.resetPostPipeline(); } catch (e) {}
      }
      this._quad.destroy(); 
      this._quad = null; 
    }
    if (this._lightSprite) { this._lightSprite.destroy(); this._lightSprite = null; }
    if (this._rt) { this._rt.destroy(); this._rt = null; }
    this.scene.scale.off('resize', this._onResize);
    this._created = false;
    this._mergedLights = [];
  }
}
