var Class = require('../utils/Class');
var EventEmitter = require('eventemitter3');
var Events = require('./events');
var Extend = require('../utils/object/Extend');
var NOOP = require('../utils/NOOP');
var BaseSound = new Class({
  Extends: EventEmitter,
  initialize: function BaseSound(manager, key, config) {
    EventEmitter.call(this);
    this.manager = manager;
    this.key = key;
    this.isPlaying = false;
    this.isPaused = false;
    this.totalRate = 1;
    this.duration = this.duration || 0;
    this.totalDuration = this.totalDuration || 0;
    this.config = {
      mute: false,
      volume: 1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: false,
      delay: 0,
      pan: 0,
    };
    this.currentConfig = this.config;
    this.config = Extend(this.config, config);
    this.markers = {};
    this.currentMarker = null;
    this.pendingRemove = false;
  },
  addMarker: function (marker) {
    if (!marker || !marker.name || typeof marker.name !== 'string') {
      return false;
    }
    if (this.markers[marker.name]) {
      console.error('addMarker ' + marker.name + ' already exists in Sound');
      return false;
    }
    marker = Extend(
      true,
      {
        name: '',
        start: 0,
        duration: this.totalDuration - (marker.start || 0),
        config: {
          mute: false,
          volume: 1,
          rate: 1,
          detune: 0,
          seek: 0,
          loop: false,
          delay: 0,
          pan: 0,
        },
      },
      marker,
    );
    this.markers[marker.name] = marker;
    return true;
  },
  updateMarker: function (marker) {
    if (!marker || !marker.name || typeof marker.name !== 'string') {
      return false;
    }
    if (!this.markers[marker.name]) {
      console.warn(
        'Audio Marker: ' + marker.name + ' missing in Sound: ' + this.key,
      );
      return false;
    }
    this.markers[marker.name] = Extend(true, this.markers[marker.name], marker);
    return true;
  },
  removeMarker: function (markerName) {
    var marker = this.markers[markerName];
    if (!marker) {
      return null;
    }
    this.markers[markerName] = null;
    return marker;
  },
  play: function (markerName, config) {
    if (markerName === undefined) {
      markerName = '';
    }
    if (typeof markerName === 'object') {
      config = markerName;
      markerName = '';
    }
    if (typeof markerName !== 'string') {
      return false;
    }
    if (!markerName) {
      this.currentMarker = null;
      this.currentConfig = this.config;
      this.duration = this.totalDuration;
    } else {
      if (!this.markers[markerName]) {
        console.warn(
          'Marker: ' + markerName + ' missing in Sound: ' + this.key,
        );
        return false;
      }
      this.currentMarker = this.markers[markerName];
      this.currentConfig = this.currentMarker.config;
      this.duration = this.currentMarker.duration;
    }
    this.resetConfig();
    this.currentConfig = Extend(this.currentConfig, config);
    this.isPlaying = true;
    this.isPaused = false;
    return true;
  },
  pause: function () {
    if (this.isPaused || !this.isPlaying) {
      return false;
    }
    this.isPlaying = false;
    this.isPaused = true;
    return true;
  },
  resume: function () {
    if (!this.isPaused || this.isPlaying) {
      return false;
    }
    this.isPlaying = true;
    this.isPaused = false;
    return true;
  },
  stop: function () {
    if (!this.isPaused && !this.isPlaying) {
      return false;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.resetConfig();
    return true;
  },
  applyConfig: function () {
    this.mute = this.currentConfig.mute;
    this.volume = this.currentConfig.volume;
    this.rate = this.currentConfig.rate;
    this.detune = this.currentConfig.detune;
    this.loop = this.currentConfig.loop;
    this.pan = this.currentConfig.pan;
  },
  resetConfig: function () {
    this.currentConfig.seek = 0;
    this.currentConfig.delay = 0;
  },
  update: NOOP,
  calculateRate: function () {
    var cent = 1.0005777895065548;
    var totalDetune = this.currentConfig.detune + this.manager.detune;
    var detuneRate = Math.pow(cent, totalDetune);
    this.totalRate = this.currentConfig.rate * this.manager.rate * detuneRate;
  },
  destroy: function () {
    if (this.pendingRemove) {
      return;
    }
    this.stop();
    this.emit(Events.DESTROY, this);
    this.removeAllListeners();
    this.pendingRemove = true;
    this.manager = null;
    this.config = null;
    this.currentConfig = null;
    this.markers = null;
    this.currentMarker = null;
  },
});
module.exports = BaseSound;
