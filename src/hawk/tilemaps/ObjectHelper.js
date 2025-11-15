var Class = require('../utils/Class');
var ObjectHelper = new Class({
  initialize: function ObjectHelper(tilesets) {
    this.gids = [];
    if (tilesets !== undefined) {
      for (var t = 0; t < tilesets.length; ++t) {
        var tileset = tilesets[t];
        for (var i = 0; i < tileset.total; ++i) {
          this.gids[tileset.firstgid + i] = tileset;
        }
      }
    }
    this._gids = this.gids;
  },
  enabled: {
    get: function () {
      return !!this.gids;
    },
    set: function (v) {
      this.gids = v ? this._gids : undefined;
    },
  },
  getTypeIncludingTile: function (obj) {
    if (obj.type !== undefined && obj.type !== '') {
      return obj.type;
    }
    if (!this.gids || obj.gid === undefined) {
      return undefined;
    }
    var tileset = this.gids[obj.gid];
    if (!tileset) {
      return undefined;
    }
    var tileData = tileset.getTileData(obj.gid);
    if (!tileData) {
      return undefined;
    }
    return tileData.type;
  },
  setTextureAndFrame: function (sprite, key, frame, obj) {
    if (key === null && this.gids && obj.gid !== undefined) {
      var tileset = this.gids[obj.gid];
      if (tileset) {
        if (key === null && tileset.image !== undefined) {
          key = tileset.image.key;
        }
        if (frame === null) {
          frame = obj.gid - tileset.firstgid;
        }
        if (!sprite.scene.textures.getFrame(key, frame)) {
          key = null;
          frame = null;
        }
      }
    }
    sprite.setTexture(key, frame);
  },
  setPropertiesFromTiledObject: function (sprite, obj) {
    if (this.gids !== undefined && obj.gid !== undefined) {
      var tileset = this.gids[obj.gid];
      if (tileset !== undefined) {
        this.setFromJSON(sprite, tileset.getTileProperties(obj.gid));
      }
    }
    this.setFromJSON(sprite, obj.properties);
  },
  setFromJSON: function (sprite, properties) {
    if (!properties) {
      return;
    }
    if (Array.isArray(properties)) {
      for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        if (sprite[prop.name] !== undefined) {
          sprite[prop.name] = prop.value;
        } else {
          sprite.setData(prop.name, prop.value);
        }
      }
      return;
    }
    for (var key in properties) {
      if (sprite[key] !== undefined) {
        sprite[key] = properties[key];
      } else {
        sprite.setData(key, properties[key]);
      }
    }
  },
});
module.exports = ObjectHelper;
