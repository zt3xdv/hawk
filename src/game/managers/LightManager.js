import Clamp from '../../hawk/math/Clamp.js';
import Linear from '../../hawk/math/Linear.js';
import IntegerToColor from '../../hawk/display/color/IntegerToColor.js';
import GetColor from '../../hawk/display/color/GetColor.js';
import BlendModes from '../../hawk/renderer/BlendModes.js';
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
    this.timeScale = options.timeScale ?? 0.5;
    this.nightColor = options.nightColor ?? 0x02061a;
    this.nightAlpha = options.nightAlpha ?? 0.7;
    const Tmin = this.totalMinutes;
    this.phasesMinutes = options.phasesMinutes ?? [
      { start: 0,    color: 0x0a0a20, alpha: 0.8 },    // Noche profunda
      { start: 3,    color: 0x0f0f2a, alpha: 0.75 },   // Noche media
      { start: 5,    color: 0x1a1a3a, alpha: 0.65 },   // Pre-amanecer
      { start: 5.5,  color: 0x2a2050, alpha: 0.55 },   // Alba temprana
      { start: 6,    color: 0x4a3070, alpha: 0.4 },    // Alba violeta
      { start: 6.5,  color: 0x8a5090, alpha: 0.25 },   // Amanecer rosado
      { start: 7,    color: 0xd07060, alpha: 0.15 },   // Amanecer naranja
      { start: 7.5,  color: 0xf0a050, alpha: 0.08 },   // Amanecer dorado
      { start: 8,    color: 0xffe080, alpha: 0.03 },   // Mañana temprana
      { start: 9,    color: 0xfff0c0, alpha: 0 },      // Mañana clara
      { start: 12,   color: 0xffffff, alpha: 0 },      // Mediodía
      { start: 15,   color: 0xfff8e0, alpha: 0 },      // Tarde temprana
      { start: 17,   color: 0xffe0a0, alpha: 0.05 },   // Tarde
      { start: 17.5, color: 0xffc080, alpha: 0.1 },    // Pre-atardecer
      { start: 18,   color: 0xff9060, alpha: 0.2 },    // Atardecer naranja
      { start: 18.5, color: 0xd06080, alpha: 0.35 },   // Atardecer rosado
      { start: 19,   color: 0x8040a0, alpha: 0.5 },    // Crepúsculo violeta
      { start: 19.5, color: 0x4030a0, alpha: 0.6 },    // Crepúsculo azul
      { start: 20,   color: 0x2020a0, alpha: 0.7 },    // Anochecer
      { start: 21,   color: 0x151550, alpha: 0.75 },   // Noche temprana
      { start: 23,   color: 0x0d0d30, alpha: 0.8 }     // Noche
    ];
    this.phases = (this.phasesMinutes.slice()).map((p, idx) => ({
      start: Clamp((p.start ?? 0) * 60, 0, this.totalSeconds),
      color: (typeof p.color !== 'undefined') ? (p.color >>> 0) : undefined,
      alpha: (typeof p.alpha !== 'undefined') ? Clamp(p.alpha, 0, 1) : undefined,
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
    this._useLowQuality = Options.get("quality") == "low";
    this._mergedLights = [];
    this._lightBridges = [];
    this._lastCamX = 0;
    this._lastCamY = 0;
    this._updateCounter = 0;
    this._time = 0;
    this._lightPulseOffsets = new Map();
    this._skipFrames = 0;
    this._renderQuality = this._useLowQuality ? 0.35 : 0.6;
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
    
    this._rt = this.scene.make.renderTexture({ 
      width: Math.floor(w * this._renderQuality), 
      height: Math.floor(h * this._renderQuality), 
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
      const PostFXPipeline = this.scene.sys.game.renderer.pipelines?.PostFXPipeline;
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
          vec4 glow = vec4(0.0);
          
          float blur = uGlowStrength / uResolution.x;
          
          glow += texture2D(uMainSampler, outTexCoord + vec2(-blur, 0.0)) * 0.12;
          glow += texture2D(uMainSampler, outTexCoord + vec2(blur, 0.0)) * 0.12;
          glow += texture2D(uMainSampler, outTexCoord + vec2(0.0, -blur)) * 0.12;
          glow += texture2D(uMainSampler, outTexCoord + vec2(0.0, blur)) * 0.12;
          glow += texture2D(uMainSampler, outTexCoord + vec2(-blur, -blur)) * 0.08;
          glow += texture2D(uMainSampler, outTexCoord + vec2(blur, -blur)) * 0.08;
          glow += texture2D(uMainSampler, outTexCoord + vec2(-blur, blur)) * 0.08;
          glow += texture2D(uMainSampler, outTexCoord + vec2(blur, blur)) * 0.08;
          glow += color * 0.2;
          
          gl_FragColor = color + glow * 0.8;
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
    const a = IntegerToColor(cA >>> 0);
    const b = IntegerToColor(cB >>> 0);
    const r = Math.round(Linear(a.red, b.red, t));
    const g = Math.round(Linear(a.green, b.green, t));
    const bl = Math.round(Linear(a.blue, b.blue, t));
    return GetColor(r, g, bl);
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
    const progress = duration > 0 ? Clamp(elapsed / duration, 0, 1) : 0;
    const curColor = (typeof phase.color !== 'undefined') ? phase.color >>> 0 : this.nightColor;
    const curAlpha = (typeof phase.alpha !== 'undefined') ? phase.alpha : this.nightAlpha;
    const nextColor = (typeof nextPhase.color !== 'undefined') ? nextPhase.color >>> 0 : this.nightColor;
    const nextAlpha = (typeof nextPhase.alpha !== 'undefined') ? nextPhase.alpha : this.nightAlpha;
    const color = LightManager._lerpColor(curColor, nextColor, progress);
    const alpha = Clamp(Linear(curAlpha, nextAlpha, progress), 0, 1);
    return {
      color,
      alpha,
      progress,
      phaseIndex: idx
    };
  }

  _mergeLights(camX, camY, camW, camH) {
    this._mergedLights = [];
    this._lightBridges = [];
    
    const visibleLights = this.lights.filter(light => {
      const sx = light.x - camX;
      const sy = light.y - camY;
      const r = light.radius || 128;
      return sx + r >= -50 && sx - r <= camW + 50 && 
             sy + r >= -50 && sy - r <= camH + 50;
    });
    
    visibleLights.forEach(light => {
      this._mergedLights.push({
        x: light.x,
        y: light.y,
        radius: light.radius || 128,
        color: light.color || 0xffffff,
        alpha: light.alpha || 1,
        intensity: light.intensity || 1,
        mask: light.mask,
        _original: true
      });
    });
    
    if (visibleLights.length > 1) {
      for (let i = 0; i < visibleLights.length; i++) {
        const lightA = visibleLights[i];
        
        for (let j = i + 1; j < visibleLights.length; j++) {
          const lightB = visibleLights[j];
          const dx = lightB.x - lightA.x;
          const dy = lightB.y - lightA.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < LIGHT_MERGE_DISTANCE * LIGHT_MERGE_DISTANCE && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const radiusA = lightA.radius || 128;
            const radiusB = lightB.radius || 128;
            const mergeStrength = 1 - (dist / LIGHT_MERGE_DISTANCE);
            
            const colorA = IntegerToColor(lightA.color || 0xffffff);
            const colorB = IntegerToColor(lightB.color || 0xffffff);
            
            const steps = Math.max(1, Math.floor(dist / 60));
            for (let k = 1; k < steps; k++) {
              const t = k / steps;
              const easedT = t * t * (3 - 2 * t);
              
              const bridgeX = lightA.x + dx * easedT;
              const bridgeY = lightA.y + dy * easedT;
              
              const dxA = bridgeX - lightA.x;
              const dyA = bridgeY - lightA.y;
              const dxB = bridgeX - lightB.x;
              const dyB = bridgeY - lightB.y;
              
              const distToA = Math.sqrt(dxA * dxA + dyA * dyA);
              const distToB = Math.sqrt(dxB * dxB + dyB * dyB);
              
              const influenceA = Math.max(0, 1 - distToA / radiusA);
              const influenceB = Math.max(0, 1 - distToB / radiusB);
              const totalInfluence = influenceA + influenceB;
              
              if (totalInfluence > 0.15) {
                const blendFactor = influenceA / totalInfluence;
                const bridgeRadius = (radiusA * blendFactor + radiusB * (1 - blendFactor)) * (0.6 + mergeStrength * 0.4);
                
                const blendedColor = GetColor(
                  Math.round(colorA.red * blendFactor + colorB.red * (1 - blendFactor)),
                  Math.round(colorA.green * blendFactor + colorB.green * (1 - blendFactor)),
                  Math.round(colorA.blue * blendFactor + colorB.blue * (1 - blendFactor))
                );
                
                const bridgeAlpha = ((lightA.alpha || 1) * influenceA + (lightB.alpha || 1) * influenceB) * mergeStrength * 0.65;
                const bridgeIntensity = ((lightA.intensity || 1) * influenceA + (lightB.intensity || 1) * influenceB) / totalInfluence;
                
                this._lightBridges.push({
                  x: bridgeX,
                  y: bridgeY,
                  radius: bridgeRadius,
                  color: blendedColor,
                  alpha: Math.min(bridgeAlpha, 1),
                  intensity: bridgeIntensity,
                  mask: lightA.mask,
                  _bridge: true
                });
              }
            }
          }
        }
      }
    }
  }

  update(time, delta) {
    if (!this._created) return;
    const dt = (delta ?? 0) / 1000;
    this._time += dt;
    
    if (this.running) {
      this.timeSeconds += dt * this.timeScale;
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
    const zoom = cam.zoom || 1;
    
    if (!this._rt || !this._rt.texture) {
      console.warn('LightManager.update: missing RenderTexture');
      return;
    }
    if (!this._quad) return;

    this._skipFrames++;
    const skipInterval = this._useLowQuality ? 2 : 1;
    if (this._skipFrames < skipInterval) {
      return;
    }
    this._skipFrames = 0;

    const camX = (cam.worldView && typeof cam.worldView.x === 'number') ? cam.worldView.x : (cam.scrollX || 0);
    const camY = (cam.worldView && typeof cam.worldView.y === 'number') ? cam.worldView.y : (cam.scrollY || 0);
    
    this._updateCounter++;
    const shouldMerge = this._updateCounter % (this._useLowQuality ? 5 : 3) === 0;
    
    if (shouldMerge || Math.abs(camX - this._lastCamX) > 80 || Math.abs(camY - this._lastCamY) > 80) {
      this._mergeLights(camX, camY, w, h);
      this._lastCamX = camX;
      this._lastCamY = camY;
    }

    this._rt.clear();
    const nc = IntegerToColor(overlay.color ?? this.nightColor);
    const nightFill = GetColor(nc.red, nc.green, nc.blue);
    const nightAlpha = Clamp(overlay.alpha ?? this.nightAlpha, 0, 1);
    this._rt.fill(nightFill, nightAlpha);

    const viewOffsetX = (typeof cam.x === 'number') ? cam.x : 0;
    const viewOffsetY = (typeof cam.y === 'number') ? cam.y : 0;

    const renderLight = (L, extraAlphaMod = 1, extraIntensityMod = 1) => {
      if (!L) return;

      const sx = ((L.x - camX) * zoom + viewOffsetX) * this._renderQuality;
      const sy = ((L.y - camY) * zoom + viewOffsetY) * this._renderQuality;

      if (!this._lightSprite || !this._lightSprite.texture) return;

      const lightId = `${Math.round(L.x / 10)}_${Math.round(L.y / 10)}`;
      if (!this._lightPulseOffsets.has(lightId)) {
        this._lightPulseOffsets.set(lightId, Math.random() * Math.PI * 2);
      }
      const offset = this._lightPulseOffsets.get(lightId);
      
      const pulsePhase = this._time * 0.5 + offset;
      const pulse = Math.sin(pulsePhase) * 0.035 + Math.sin(pulsePhase * 1.5) * 0.025;
      const pulseFactor = 1 + pulse;
      
      const shapeNoise = Math.sin(pulsePhase * 0.5) * 0.025;
      
      const intensityMod = (L._original ? 1.2 : 0.9) * extraIntensityMod;
      const alpha = Clamp(L.alpha * (L.intensity ?? 1) * intensityMod * pulseFactor * extraAlphaMod, 0, 1);
      
      const baseScale = (L.radius / 64) * this._renderQuality * zoom;
      const scaleX = baseScale * (1 + shapeNoise);
      const scaleY = baseScale * (1 - shapeNoise * 0.5);

      this._lightSprite.setPosition(sx, sy)
        .setAlpha(alpha)
        .setTint(L.color)
        .setScale(scaleX, scaleY)
        .setRotation(pulsePhase * 0.015);
      this._rt.draw(this._lightSprite);
      
      if (alpha > 0.3 && L._original) {
        this._lightSprite.setAlpha(alpha * 0.35)
          .setScale(scaleX * 1.5, scaleY * 1.5);
        this._rt.draw(this._lightSprite);
      }
    };

    if (this._lightBridges && this._lightBridges.length > 0) {
      for (let i = 0; i < this._lightBridges.length; i++) {
        renderLight(this._lightBridges[i], 0.75, 1);
      }
    }
    
    for (let i = 0; i < this._mergedLights.length; i++) {
      renderLight(this._mergedLights[i], 1, 1);
    }

    if (this._rt && this._rt.texture && this._quad.texture !== this._rt.texture) {
      this._quad.setTexture(this._rt.texture);
      this._quad.setDisplaySize(w, h);
    } else {
      this._quad.setDisplaySize(w, h);
    }
    
    this._quad.setBlendMode(BlendModes.MULTIPLY);
    
    if (this._glowPipeline && this._glowPipeline.set2f && this._glowPipeline.set1f) {
      try {
        this._glowPipeline.set2f('uResolution', w, h);
        this._glowPipeline.set1f('uGlowStrength', this._useLowQuality ? 4.0 : 6.0);
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
      alpha: Clamp(alpha, 0, 1),
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
    this._lightBridges = [];
  }
  
  setNightAlpha(a) { this.nightAlpha = Clamp(a, 0, 1); }
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
    
    this._rt = this.scene.make.renderTexture({ 
      width: Math.floor(w * this._renderQuality), 
      height: Math.floor(h * this._renderQuality), 
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
    this._lightBridges = [];
  }
}
