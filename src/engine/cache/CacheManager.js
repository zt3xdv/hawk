var BaseCache = require('./BaseCache');
var Class = require('../utils/Class');
var GameEvents = require('../core/events');
var CacheManager = new Class({
  initialize: function CacheManager(game) {
    this.game = game;
    this.binary = new BaseCache();
    this.bitmapFont = new BaseCache();
    this.json = new BaseCache();
    this.physics = new BaseCache();
    this.shader = new BaseCache();
    this.audio = new BaseCache();
    this.video = new BaseCache();
    this.text = new BaseCache();
    this.html = new BaseCache();
    this.obj = new BaseCache();
    this.tilemap = new BaseCache();
    this.xml = new BaseCache();
    this.custom = {};
    this.game.events.once(GameEvents.DESTROY, this.destroy, this);
  },
  addCustom: function (key) {
    if (!this.custom.hasOwnProperty(key)) {
      this.custom[key] = new BaseCache();
    }
    return this.custom[key];
  },
  destroy: function () {
    var keys = [
      'binary',
      'bitmapFont',
      'json',
      'physics',
      'shader',
      'audio',
      'video',
      'text',
      'html',
      'obj',
      'tilemap',
      'xml',
    ];
    for (var i = 0; i < keys.length; i++) {
      this[keys[i]].destroy();
      this[keys[i]] = null;
    }
    for (var key in this.custom) {
      this.custom[key].destroy();
    }
    this.custom = null;
    this.game = null;
  },
});
module.exports = CacheManager;
