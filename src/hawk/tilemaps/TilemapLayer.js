var Class = require('../utils/Class');
var CollisionComponent = require('../physics/arcade/components/Collision');
var Components = require('../gameobjects/components');
var GameObject = require('../gameobjects/GameObject');
var TilemapComponents = require('./components');
var TilemapLayerRender = require('./TilemapLayerRender');
var Vector2 = require('../math/Vector2');
var TilemapLayer = new Class({
  Extends: GameObject,
  Mixins: [
    Components.Alpha,
    Components.BlendMode,
    Components.ComputedSize,
    Components.Depth,
    Components.Flip,
    Components.GetBounds,
    Components.Mask,
    Components.Origin,
    Components.Pipeline,
    Components.PostPipeline,
    Components.Transform,
    Components.Visible,
    Components.ScrollFactor,
    CollisionComponent,
    TilemapLayerRender,
  ],
  initialize: function TilemapLayer(scene, tilemap, layerIndex, tileset, x, y) {
    GameObject.call(this, scene, 'TilemapLayer');
    this.isTilemap = true;
    this.tilemap = tilemap;
    this.layerIndex = layerIndex;
    this.layer = tilemap.layers[layerIndex];
    this.layer.tilemapLayer = this;
    this.tileset = [];
    this.tilesDrawn = 0;
    this.tilesTotal = this.layer.width * this.layer.height;
    this.culledTiles = [];
    this.skipCull = false;
    this.cullPaddingX = 1;
    this.cullPaddingY = 1;
    this.cullCallback = TilemapComponents.GetCullTilesFunction(
      this.layer.orientation,
    );
    this._renderOrder = 0;
    this.gidMap = [];
    this.tempVec = new Vector2();
    this.collisionCategory = 0x0001;
    this.collisionMask = 1;
    this.setTilesets(tileset);
    this.setAlpha(this.layer.alpha);
    this.setPosition(x, y);
    this.setOrigin(0, 0);
    this.setSize(
      tilemap.tileWidth * this.layer.width,
      tilemap.tileHeight * this.layer.height,
    );
    this.initPipeline();
    this.initPostPipeline(false);
  },
  setTilesets: function (tilesets) {
    var gidMap = [];
    var setList = [];
    var map = this.tilemap;
    if (!Array.isArray(tilesets)) {
      tilesets = [tilesets];
    }
    for (var i = 0; i < tilesets.length; i++) {
      var tileset = tilesets[i];
      if (typeof tileset === 'string') {
        tileset = map.getTileset(tileset);
      }
      if (tileset) {
        setList.push(tileset);
        var s = tileset.firstgid;
        for (var t = 0; t < tileset.total; t++) {
          gidMap[s + t] = tileset;
        }
      }
    }
    this.gidMap = gidMap;
    this.tileset = setList;
  },
  setRenderOrder: function (renderOrder) {
    var orders = ['right-down', 'left-down', 'right-up', 'left-up'];
    if (typeof renderOrder === 'string') {
      renderOrder = orders.indexOf(renderOrder);
    }
    if (renderOrder >= 0 && renderOrder < 4) {
      this._renderOrder = renderOrder;
    }
    return this;
  },
  calculateFacesAt: function (tileX, tileY) {
    TilemapComponents.CalculateFacesAt(tileX, tileY, this.layer);
    return this;
  },
  calculateFacesWithin: function (tileX, tileY, width, height) {
    TilemapComponents.CalculateFacesWithin(
      tileX,
      tileY,
      width,
      height,
      this.layer,
    );
    return this;
  },
  createFromTiles: function (
    indexes,
    replacements,
    spriteConfig,
    scene,
    camera,
  ) {
    return TilemapComponents.CreateFromTiles(
      indexes,
      replacements,
      spriteConfig,
      scene,
      camera,
      this.layer,
    );
  },
  cull: function (camera) {
    return this.cullCallback(
      this.layer,
      camera,
      this.culledTiles,
      this._renderOrder,
    );
  },
  copy: function (
    srcTileX,
    srcTileY,
    width,
    height,
    destTileX,
    destTileY,
    recalculateFaces,
  ) {
    TilemapComponents.Copy(
      srcTileX,
      srcTileY,
      width,
      height,
      destTileX,
      destTileY,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  fill: function (index, tileX, tileY, width, height, recalculateFaces) {
    TilemapComponents.Fill(
      index,
      tileX,
      tileY,
      width,
      height,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  filterTiles: function (
    callback,
    context,
    tileX,
    tileY,
    width,
    height,
    filteringOptions,
  ) {
    return TilemapComponents.FilterTiles(
      callback,
      context,
      tileX,
      tileY,
      width,
      height,
      filteringOptions,
      this.layer,
    );
  },
  findByIndex: function (findIndex, skip, reverse) {
    return TilemapComponents.FindByIndex(findIndex, skip, reverse, this.layer);
  },
  findTile: function (
    callback,
    context,
    tileX,
    tileY,
    width,
    height,
    filteringOptions,
  ) {
    return TilemapComponents.FindTile(
      callback,
      context,
      tileX,
      tileY,
      width,
      height,
      filteringOptions,
      this.layer,
    );
  },
  forEachTile: function (
    callback,
    context,
    tileX,
    tileY,
    width,
    height,
    filteringOptions,
  ) {
    TilemapComponents.ForEachTile(
      callback,
      context,
      tileX,
      tileY,
      width,
      height,
      filteringOptions,
      this.layer,
    );
    return this;
  },
  setTint: function (tint, tileX, tileY, width, height, filteringOptions) {
    if (tint === undefined) {
      tint = 0xffffff;
    }
    var tintTile = function (tile) {
      tile.tint = tint;
      tile.tintFill = false;
    };
    return this.forEachTile(
      tintTile,
      this,
      tileX,
      tileY,
      width,
      height,
      filteringOptions,
    );
  },
  setTintFill: function (tint, tileX, tileY, width, height, filteringOptions) {
    if (tint === undefined) {
      tint = 0xffffff;
    }
    var tintTile = function (tile) {
      tile.tint = tint;
      tile.tintFill = true;
    };
    return this.forEachTile(
      tintTile,
      this,
      tileX,
      tileY,
      width,
      height,
      filteringOptions,
    );
  },
  getTileAt: function (tileX, tileY, nonNull) {
    return TilemapComponents.GetTileAt(tileX, tileY, nonNull, this.layer);
  },
  getTileAtWorldXY: function (worldX, worldY, nonNull, camera) {
    return TilemapComponents.GetTileAtWorldXY(
      worldX,
      worldY,
      nonNull,
      camera,
      this.layer,
    );
  },
  getIsoTileAtWorldXY: function (worldX, worldY, originTop, nonNull, camera) {
    if (originTop === undefined) {
      originTop = true;
    }
    var point = this.tempVec;
    TilemapComponents.IsometricWorldToTileXY(
      worldX,
      worldY,
      true,
      point,
      camera,
      this.layer,
      originTop,
    );
    return this.getTileAt(point.x, point.y, nonNull);
  },
  getTilesWithin: function (tileX, tileY, width, height, filteringOptions) {
    return TilemapComponents.GetTilesWithin(
      tileX,
      tileY,
      width,
      height,
      filteringOptions,
      this.layer,
    );
  },
  getTilesWithinShape: function (shape, filteringOptions, camera) {
    return TilemapComponents.GetTilesWithinShape(
      shape,
      filteringOptions,
      camera,
      this.layer,
    );
  },
  getTilesWithinWorldXY: function (
    worldX,
    worldY,
    width,
    height,
    filteringOptions,
    camera,
  ) {
    return TilemapComponents.GetTilesWithinWorldXY(
      worldX,
      worldY,
      width,
      height,
      filteringOptions,
      camera,
      this.layer,
    );
  },
  hasTileAt: function (tileX, tileY) {
    return TilemapComponents.HasTileAt(tileX, tileY, this.layer);
  },
  hasTileAtWorldXY: function (worldX, worldY, camera) {
    return TilemapComponents.HasTileAtWorldXY(
      worldX,
      worldY,
      camera,
      this.layer,
    );
  },
  putTileAt: function (tile, tileX, tileY, recalculateFaces) {
    return TilemapComponents.PutTileAt(
      tile,
      tileX,
      tileY,
      recalculateFaces,
      this.layer,
    );
  },
  putTileAtWorldXY: function (tile, worldX, worldY, recalculateFaces, camera) {
    return TilemapComponents.PutTileAtWorldXY(
      tile,
      worldX,
      worldY,
      recalculateFaces,
      camera,
      this.layer,
    );
  },
  putTilesAt: function (tilesArray, tileX, tileY, recalculateFaces) {
    TilemapComponents.PutTilesAt(
      tilesArray,
      tileX,
      tileY,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  randomize: function (tileX, tileY, width, height, indexes) {
    TilemapComponents.Randomize(
      tileX,
      tileY,
      width,
      height,
      indexes,
      this.layer,
    );
    return this;
  },
  removeTileAt: function (tileX, tileY, replaceWithNull, recalculateFaces) {
    return TilemapComponents.RemoveTileAt(
      tileX,
      tileY,
      replaceWithNull,
      recalculateFaces,
      this.layer,
    );
  },
  removeTileAtWorldXY: function (
    worldX,
    worldY,
    replaceWithNull,
    recalculateFaces,
    camera,
  ) {
    return TilemapComponents.RemoveTileAtWorldXY(
      worldX,
      worldY,
      replaceWithNull,
      recalculateFaces,
      camera,
      this.layer,
    );
  },
  renderDebug: function (graphics, styleConfig) {
    TilemapComponents.RenderDebug(graphics, styleConfig, this.layer);
    return this;
  },
  replaceByIndex: function (findIndex, newIndex, tileX, tileY, width, height) {
    TilemapComponents.ReplaceByIndex(
      findIndex,
      newIndex,
      tileX,
      tileY,
      width,
      height,
      this.layer,
    );
    return this;
  },
  setSkipCull: function (value) {
    if (value === undefined) {
      value = true;
    }
    this.skipCull = value;
    return this;
  },
  setCullPadding: function (paddingX, paddingY) {
    if (paddingX === undefined) {
      paddingX = 1;
    }
    if (paddingY === undefined) {
      paddingY = 1;
    }
    this.cullPaddingX = paddingX;
    this.cullPaddingY = paddingY;
    return this;
  },
  setCollision: function (indexes, collides, recalculateFaces, updateLayer) {
    TilemapComponents.SetCollision(
      indexes,
      collides,
      recalculateFaces,
      this.layer,
      updateLayer,
    );
    return this;
  },
  setCollisionBetween: function (start, stop, collides, recalculateFaces) {
    TilemapComponents.SetCollisionBetween(
      start,
      stop,
      collides,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  setCollisionByProperty: function (properties, collides, recalculateFaces) {
    TilemapComponents.SetCollisionByProperty(
      properties,
      collides,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  setCollisionByExclusion: function (indexes, collides, recalculateFaces) {
    TilemapComponents.SetCollisionByExclusion(
      indexes,
      collides,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  setCollisionFromCollisionGroup: function (collides, recalculateFaces) {
    TilemapComponents.SetCollisionFromCollisionGroup(
      collides,
      recalculateFaces,
      this.layer,
    );
    return this;
  },
  setTileIndexCallback: function (indexes, callback, callbackContext) {
    TilemapComponents.SetTileIndexCallback(
      indexes,
      callback,
      callbackContext,
      this.layer,
    );
    return this;
  },
  setTileLocationCallback: function (
    tileX,
    tileY,
    width,
    height,
    callback,
    callbackContext,
  ) {
    TilemapComponents.SetTileLocationCallback(
      tileX,
      tileY,
      width,
      height,
      callback,
      callbackContext,
      this.layer,
    );
    return this;
  },
  shuffle: function (tileX, tileY, width, height) {
    TilemapComponents.Shuffle(tileX, tileY, width, height, this.layer);
    return this;
  },
  swapByIndex: function (indexA, indexB, tileX, tileY, width, height) {
    TilemapComponents.SwapByIndex(
      indexA,
      indexB,
      tileX,
      tileY,
      width,
      height,
      this.layer,
    );
    return this;
  },
  tileToWorldX: function (tileX, camera) {
    return this.tilemap.tileToWorldX(tileX, camera, this);
  },
  tileToWorldY: function (tileY, camera) {
    return this.tilemap.tileToWorldY(tileY, camera, this);
  },
  tileToWorldXY: function (tileX, tileY, point, camera) {
    return this.tilemap.tileToWorldXY(tileX, tileY, point, camera, this);
  },
  getTileCorners: function (tileX, tileY, camera) {
    return this.tilemap.getTileCorners(tileX, tileY, camera, this);
  },
  weightedRandomize: function (weightedIndexes, tileX, tileY, width, height) {
    TilemapComponents.WeightedRandomize(
      tileX,
      tileY,
      width,
      height,
      weightedIndexes,
      this.layer,
    );
    return this;
  },
  worldToTileX: function (worldX, snapToFloor, camera) {
    return this.tilemap.worldToTileX(worldX, snapToFloor, camera, this);
  },
  worldToTileY: function (worldY, snapToFloor, camera) {
    return this.tilemap.worldToTileY(worldY, snapToFloor, camera, this);
  },
  worldToTileXY: function (worldX, worldY, snapToFloor, point, camera) {
    return this.tilemap.worldToTileXY(
      worldX,
      worldY,
      snapToFloor,
      point,
      camera,
      this,
    );
  },
  destroy: function (removeFromTilemap) {
    if (removeFromTilemap === undefined) {
      removeFromTilemap = true;
    }
    if (!this.tilemap) {
      return;
    }
    if (this.layer.tilemapLayer === this) {
      this.layer.tilemapLayer = undefined;
    }
    if (removeFromTilemap) {
      this.tilemap.removeLayer(this);
    }
    this.tilemap = undefined;
    this.layer = undefined;
    this.culledTiles.length = 0;
    this.cullCallback = null;
    this.gidMap = [];
    this.tileset = [];
    GameObject.prototype.destroy.call(this);
  },
});
module.exports = TilemapLayer;
