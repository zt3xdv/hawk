var BuildTilesetIndex = require('./parsers/tiled/BuildTilesetIndex');
var Class = require('../utils/Class');
var DegToRad = require('../math/DegToRad');
var Formats = require('./Formats');
var GetFastValue = require('../utils/object/GetFastValue');
var LayerData = require('./mapdata/LayerData');
var ObjectHelper = require('./ObjectHelper');
var ORIENTATION = require('./const/ORIENTATION_CONST');
var Rotate = require('../math/Rotate');
var SpliceOne = require('../utils/array/SpliceOne');
var Sprite = require('../gameobjects/sprite/Sprite');
var Tile = require('./Tile');
var TilemapComponents = require('./components');
var TilemapLayer = require('./TilemapLayer');
var Tileset = require('./Tileset');

var Tilemap = new Class({

    initialize:

        function Tilemap (scene, mapData)
        {

            this.scene = scene;

            this.tileWidth = mapData.tileWidth;

            this.tileHeight = mapData.tileHeight;

            this.width = mapData.width;

            this.height = mapData.height;

            this.orientation = mapData.orientation;

            this.renderOrder = mapData.renderOrder;

            this.format = mapData.format;

            this.version = mapData.version;

            this.properties = mapData.properties;

            this.widthInPixels = mapData.widthInPixels;

            this.heightInPixels = mapData.heightInPixels;

            this.imageCollections = mapData.imageCollections;

            this.images = mapData.images;

            this.layers = mapData.layers;

            this.tiles = mapData.tiles;

            this.tilesets = mapData.tilesets;

            this.objects = mapData.objects;

            this.currentLayerIndex = 0;

            this.hexSideLength = mapData.hexSideLength;

            var orientation = this.orientation;

            this._convert = {
                WorldToTileXY: TilemapComponents.GetWorldToTileXYFunction(orientation),
                WorldToTileX: TilemapComponents.GetWorldToTileXFunction(orientation),
                WorldToTileY: TilemapComponents.GetWorldToTileYFunction(orientation),
                TileToWorldXY: TilemapComponents.GetTileToWorldXYFunction(orientation),
                TileToWorldX: TilemapComponents.GetTileToWorldXFunction(orientation),
                TileToWorldY: TilemapComponents.GetTileToWorldYFunction(orientation),
                GetTileCorners: TilemapComponents.GetTileCornersFunction(orientation)
            };
        },

    setRenderOrder: function (renderOrder)
    {
        var orders = [ 'right-down', 'left-down', 'right-up', 'left-up' ];

        if (typeof renderOrder === 'number')
        {
            renderOrder = orders[ renderOrder ];
        }

        if (orders.indexOf(renderOrder) > -1)
        {
            this.renderOrder = renderOrder;
        }

        return this;
    },

    addTilesetImage: function (tilesetName, key, tileWidth, tileHeight, tileMargin, tileSpacing, gid, tileOffset)
    {
        if (tilesetName === undefined) { return null; }
        if (key === undefined || key === null) { key = tilesetName; }

        var textureManager = this.scene.sys.textures;

        if (!textureManager.exists(key))
        {
            console.warn('Texture key "%s" not found', key);
            return null;
        }

        var texture = textureManager.get(key);

        var index = this.getTilesetIndex(tilesetName);

        if (index === null && this.format === Formats.TILED_JSON)
        {
            console.warn('Tilemap has no tileset "%s". Its tilesets are %o', tilesetName, this.tilesets);
            return null;
        }

        var tileset = this.tilesets[ index ];

        if (tileset)
        {
            if (tileWidth || tileHeight)
            {
                tileset.setTileSize(tileWidth, tileHeight);
            }

            if (tileMargin || tileSpacing)
            {
                tileset.setSpacing(tileMargin, tileSpacing);
            }

            tileset.setImage(texture);

            return tileset;
        }

        if (tileWidth === undefined) { tileWidth = this.tileWidth; }
        if (tileHeight === undefined) { tileHeight = this.tileHeight; }
        if (tileMargin === undefined) { tileMargin = 0; }
        if (tileSpacing === undefined) { tileSpacing = 0; }
        if (gid === undefined) { gid = 0; }
        if (tileOffset === undefined) { tileOffset = { x: 0, y: 0 }; }

        tileset = new Tileset(tilesetName, gid, tileWidth, tileHeight, tileMargin, tileSpacing, undefined, undefined, tileOffset);

        tileset.setImage(texture);

        this.tilesets.push(tileset);

        this.tiles = BuildTilesetIndex(this);

        return tileset;
    },

    copy: function (srcTileX, srcTileY, width, height, destTileX, destTileY, recalculateFaces, layer)
    {
        layer = this.getLayer(layer);

        if (layer !== null)
        {
            TilemapComponents.Copy(
                srcTileX, srcTileY,
                width, height,
                destTileX, destTileY,
                recalculateFaces, layer
            );

            return this;
        }
        else
        {
            return null;
        }
    },

    createBlankLayer: function (name, tileset, x, y, width, height, tileWidth, tileHeight)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (width === undefined) { width = this.width; }
        if (height === undefined) { height = this.height; }
        if (tileWidth === undefined) { tileWidth = this.tileWidth; }
        if (tileHeight === undefined) { tileHeight = this.tileHeight; }

        var index = this.getLayerIndex(name);

        if (index !== null)
        {
            console.warn('Invalid Tilemap Layer ID: ' + name);
            return null;
        }

        var layerData = new LayerData({
            name: name,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: width,
            height: height,
            orientation: this.orientation,
            hexSideLength: this.hexSideLength
        });

        var row;

        for (var tileY = 0; tileY < height; tileY++)
        {
            row = [];

            for (var tileX = 0; tileX < width; tileX++)
            {
                row.push(new Tile(layerData, -1, tileX, tileY, tileWidth, tileHeight, this.tileWidth, this.tileHeight));
            }

            layerData.data.push(row);
        }

        this.layers.push(layerData);

        this.currentLayerIndex = this.layers.length - 1;

        var layer = new TilemapLayer(this.scene, this, this.currentLayerIndex, tileset, x, y);

        layer.setRenderOrder(this.renderOrder);

        this.scene.sys.displayList.add(layer);

        return layer;
    },

    createLayer: function (layerID, tileset, x, y)
    {
        var index = this.getLayerIndex(layerID);

        if (index === null)
        {
            console.warn('Invalid Tilemap Layer ID: ' + layerID);

            if (typeof layerID === 'string')
            {
                console.warn('Valid tilelayer names: %o', this.getTileLayerNames());
            }

            return null;
        }

        var layerData = this.layers[ index ];

        if (layerData.tilemapLayer)
        {
            console.warn('Tilemap Layer ID already exists:' + layerID);
            return null;
        }

        this.currentLayerIndex = index;

        if (x === undefined)
        {
            x = layerData.x;
        }

        if (y === undefined)
        {
            y = layerData.y;
        }

        var layer = new TilemapLayer(this.scene, this, index, tileset, x, y);

        layer.setRenderOrder(this.renderOrder);

        this.scene.sys.displayList.add(layer);

        return layer;
    },

    createFromObjects: function (objectLayerName, config, useTileset)
    {
        if (useTileset === undefined) { useTileset = true; }

        var results = [];

        var objectLayer = this.getObjectLayer(objectLayerName);

        if (!objectLayer)
        {
            console.warn('createFromObjects: Invalid objectLayerName given: ' + objectLayerName);

            return results;
        }

        var objectHelper = new ObjectHelper(useTileset ? this.tilesets : undefined);

        if (!Array.isArray(config))
        {
            config = [ config ];
        }

        var objects = objectLayer.objects;

        for (var c = 0; c < config.length; c++)
        {
            var singleConfig = config[ c ];

            var id = GetFastValue(singleConfig, 'id', null);
            var gid = GetFastValue(singleConfig, 'gid', null);
            var name = GetFastValue(singleConfig, 'name', null);
            var type = GetFastValue(singleConfig, 'type', null);
            objectHelper.enabled = !GetFastValue(singleConfig, 'ignoreTileset', null);

            var obj;
            var toConvert = [];

            for (var s = 0; s < objects.length; s++)
            {
                obj = objects[ s ];

                if (
                    (id === null && gid === null && name === null && type === null) ||
                    (id !== null && obj.id === id) ||
                    (gid !== null && obj.gid === gid) ||
                    (name !== null && obj.name === name) ||
                    (type !== null && objectHelper.getTypeIncludingTile(obj) === type)
                )
                {
                    toConvert.push(obj);
                }
            }

            var classType = GetFastValue(singleConfig, 'classType', Sprite);
            var scene = GetFastValue(singleConfig, 'scene', this.scene);
            var container = GetFastValue(singleConfig, 'container', null);
            var texture = GetFastValue(singleConfig, 'key', null);
            var frame = GetFastValue(singleConfig, 'frame', null);

            for (var i = 0; i < toConvert.length; i++)
            {
                obj = toConvert[ i ];

                var sprite = new classType(scene);

                sprite.setName(obj.name);
                sprite.setPosition(obj.x, obj.y);
                objectHelper.setTextureAndFrame(sprite, texture, frame, obj);

                if (obj.width)
                {
                    sprite.displayWidth = obj.width;
                }

                if (obj.height)
                {
                    sprite.displayHeight = obj.height;
                }

                if (this.orientation === ORIENTATION.ISOMETRIC)
                {
                    var isometricRatio = this.tileWidth / this.tileHeight;
                    var isometricPosition = {
                        x: sprite.x - sprite.y,
                        y: (sprite.x + sprite.y) / isometricRatio
                    };

                    sprite.x = isometricPosition.x;
                    sprite.y = isometricPosition.y;
                }

                var offset = {
                    x: sprite.originX * obj.width,
                    y: (sprite.originY - (obj.gid ? 1 : 0)) * obj.height
                };

                if (obj.rotation)
                {
                    var angle = DegToRad(obj.rotation);

                    Rotate(offset, angle);

                    sprite.rotation = angle;
                }

                sprite.x += offset.x;
                sprite.y += offset.y;

                if (obj.flippedHorizontal !== undefined || obj.flippedVertical !== undefined)
                {
                    sprite.setFlip(obj.flippedHorizontal, obj.flippedVertical);
                }

                if (!obj.visible)
                {
                    sprite.visible = false;
                }

                objectHelper.setPropertiesFromTiledObject(sprite, obj);

                if (container)
                {
                    container.add(sprite);
                }
                else
                {
                    scene.add.existing(sprite);
                }

                results.push(sprite);
            }
        }

        return results;
    },

    createFromTiles: function (indexes, replacements, spriteConfig, scene, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.CreateFromTiles(indexes, replacements, spriteConfig, scene, camera, layer);
    },

    fill: function (index, tileX, tileY, width, height, recalculateFaces, layer)
    {
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.Fill(index, tileX, tileY, width, height, recalculateFaces, layer);

        return this;
    },

    filterObjects: function (objectLayer, callback, context)
    {
        if (typeof objectLayer === 'string')
        {
            var name = objectLayer;

            objectLayer = this.getObjectLayer(objectLayer);

            if (!objectLayer)
            {
                console.warn('No object layer found with the name: ' + name);
                return null;
            }
        }

        return objectLayer.objects.filter(callback, context);
    },

    filterTiles: function (callback, context, tileX, tileY, width, height, filteringOptions, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.FilterTiles(callback, context, tileX, tileY, width, height, filteringOptions, layer);
    },

    findByIndex: function (findIndex, skip, reverse, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.FindByIndex(findIndex, skip, reverse, layer);
    },

    findObject: function (objectLayer, callback, context)
    {
        if (typeof objectLayer === 'string')
        {
            var name = objectLayer;

            objectLayer = this.getObjectLayer(objectLayer);

            if (!objectLayer)
            {
                console.warn('No object layer found with the name: ' + name);
                return null;
            }
        }

        return objectLayer.objects.find(callback, context) || null;
    },

    findTile: function (callback, context, tileX, tileY, width, height, filteringOptions, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.FindTile(callback, context, tileX, tileY, width, height, filteringOptions, layer);
    },

    forEachTile: function (callback, context, tileX, tileY, width, height, filteringOptions, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.ForEachTile(callback, context, tileX, tileY, width, height, filteringOptions, layer);

        return this;
    },

    getImageIndex: function (name)
    {
        return this.getIndex(this.images, name);
    },

    getImageLayerNames: function ()
    {
        if (!this.images || !Array.isArray(this.images))
        {
            return [];
        }

        return this.images.map(function (image)
        {
            return image.name;
        });
    },

    getIndex: function (location, name)
    {
        for (var i = 0; i < location.length; i++)
        {
            if (location[ i ].name === name)
            {
                return i;
            }
        }

        return null;
    },

    getLayer: function (layer)
    {
        var index = this.getLayerIndex(layer);

        return (index !== null) ? this.layers[ index ] : null;
    },

    getObjectLayer: function (name)
    {
        var index = this.getIndex(this.objects, name);

        return (index !== null) ? this.objects[ index ] : null;
    },

    getObjectLayerNames: function ()
    {
        if (!this.objects || !Array.isArray(this.objects))
        {
            return [];
        }

        return this.objects.map(function (object)
        {
            return object.name;
        });
    },

    getLayerIndex: function (layer)
    {
        if (layer === undefined)
        {
            return this.currentLayerIndex;
        }
        else if (typeof layer === 'string')
        {
            return this.getLayerIndexByName(layer);
        }
        else if (typeof layer === 'number' && layer < this.layers.length)
        {
            return layer;
        }
        else if (layer instanceof TilemapLayer && layer.tilemap === this)
        {
            return layer.layerIndex;
        }
        else
        {
            return null;
        }
    },

    getLayerIndexByName: function (name)
    {
        return this.getIndex(this.layers, name);
    },

    getTileAt: function (tileX, tileY, nonNull, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.GetTileAt(tileX, tileY, nonNull, layer);
    },

    getTileAtWorldXY: function (worldX, worldY, nonNull, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.GetTileAtWorldXY(worldX, worldY, nonNull, camera, layer);
    },

    getTileLayerNames: function ()
    {
        if (!this.layers || !Array.isArray(this.layers))
        {
            return [];
        }

        return this.layers.map(function (layer)
        {
            return layer.name;
        });
    },

    getTilesWithin: function (tileX, tileY, width, height, filteringOptions, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.GetTilesWithin(tileX, tileY, width, height, filteringOptions, layer);
    },

    getTilesWithinShape: function (shape, filteringOptions, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.GetTilesWithinShape(shape, filteringOptions, camera, layer);
    },

    getTilesWithinWorldXY: function (worldX, worldY, width, height, filteringOptions, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.GetTilesWithinWorldXY(worldX, worldY, width, height, filteringOptions, camera, layer);
    },

    getTileset: function (name)
    {
        var index = this.getIndex(this.tilesets, name);

        return (index !== null) ? this.tilesets[ index ] : null;
    },

    getTilesetIndex: function (name)
    {
        return this.getIndex(this.tilesets, name);
    },

    hasTileAt: function (tileX, tileY, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.HasTileAt(tileX, tileY, layer);
    },

    hasTileAtWorldXY: function (worldX, worldY, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.HasTileAtWorldXY(worldX, worldY, camera, layer);
    },

    layer: {
        get: function ()
        {
            return this.layers[ this.currentLayerIndex ];
        },

        set: function (layer)
        {
            this.setLayer(layer);
        }
    },

    putTileAt: function (tile, tileX, tileY, recalculateFaces, layer)
    {
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.PutTileAt(tile, tileX, tileY, recalculateFaces, layer);
    },

    putTileAtWorldXY: function (tile, worldX, worldY, recalculateFaces, camera, layer)
    {
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.PutTileAtWorldXY(tile, worldX, worldY, recalculateFaces, camera, layer);
    },

    putTilesAt: function (tilesArray, tileX, tileY, recalculateFaces, layer)
    {
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.PutTilesAt(tilesArray, tileX, tileY, recalculateFaces, layer);

        return this;
    },

    randomize: function (tileX, tileY, width, height, indexes, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.Randomize(tileX, tileY, width, height, indexes, layer);

        return this;
    },

    calculateFacesAt: function (tileX, tileY, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.CalculateFacesAt(tileX, tileY, layer);

        return this;
    },

    calculateFacesWithin: function (tileX, tileY, width, height, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.CalculateFacesWithin(tileX, tileY, width, height, layer);

        return this;
    },

    removeLayer: function (layer)
    {
        var index = this.getLayerIndex(layer);

        if (index !== null)
        {
            SpliceOne(this.layers, index);

            for (var i = index; i < this.layers.length; i++)
            {
                if (this.layers[ i ].tilemapLayer)
                {
                    this.layers[ i ].tilemapLayer.layerIndex--;
                }
            }

            if (this.currentLayerIndex === index)
            {
                this.currentLayerIndex = 0;
            }

            return this;
        }
        else
        {
            return null;
        }
    },

    destroyLayer: function (layer)
    {
        var index = this.getLayerIndex(layer);

        if (index !== null)
        {
            layer = this.layers[ index ];

            layer.tilemapLayer.destroy();

            SpliceOne(this.layers, index);

            if (this.currentLayerIndex === index)
            {
                this.currentLayerIndex = 0;
            }

            return this;
        }
        else
        {
            return null;
        }
    },

    removeAllLayers: function ()
    {
        var layers = this.layers;

        for (var i = 0; i < layers.length; i++)
        {
            if (layers[ i ].tilemapLayer)
            {
                layers[ i ].tilemapLayer.destroy(false);
            }
        }

        layers.length = 0;

        this.currentLayerIndex = 0;

        return this;
    },

    removeTile: function (tiles, replaceIndex, recalculateFaces)
    {
        if (replaceIndex === undefined) { replaceIndex = -1; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        var removed = [];

        if (!Array.isArray(tiles))
        {
            tiles = [ tiles ];
        }

        for (var i = 0; i < tiles.length; i++)
        {
            var tile = tiles[ i ];

            removed.push(this.removeTileAt(tile.x, tile.y, true, recalculateFaces, tile.tilemapLayer));

            if (replaceIndex > -1)
            {
                this.putTileAt(replaceIndex, tile.x, tile.y, recalculateFaces, tile.tilemapLayer);
            }
        }

        return removed;
    },

    removeTileAt: function (tileX, tileY, replaceWithNull, recalculateFaces, layer)
    {
        if (replaceWithNull === undefined) { replaceWithNull = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.RemoveTileAt(tileX, tileY, replaceWithNull, recalculateFaces, layer);
    },

    removeTileAtWorldXY: function (worldX, worldY, replaceWithNull, recalculateFaces, camera, layer)
    {
        if (replaceWithNull === undefined) { replaceWithNull = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return TilemapComponents.RemoveTileAtWorldXY(worldX, worldY, replaceWithNull, recalculateFaces, camera, layer);
    },

    renderDebug: function (graphics, styleConfig, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        if (this.orientation === ORIENTATION.ORTHOGONAL)
        {
            TilemapComponents.RenderDebug(graphics, styleConfig, layer);
        }

        return this;
    },

    renderDebugFull: function (graphics, styleConfig)
    {
        var layers = this.layers;

        for (var i = 0; i < layers.length; i++)
        {
            TilemapComponents.RenderDebug(graphics, styleConfig, layers[ i ]);
        }

        return this;
    },

    replaceByIndex: function (findIndex, newIndex, tileX, tileY, width, height, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.ReplaceByIndex(findIndex, newIndex, tileX, tileY, width, height, layer);

        return this;
    },

    setCollision: function (indexes, collides, recalculateFaces, layer, updateLayer)
    {
        if (collides === undefined) { collides = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }
        if (updateLayer === undefined) { updateLayer = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetCollision(indexes, collides, recalculateFaces, layer, updateLayer);

        return this;
    },

    setCollisionBetween: function (start, stop, collides, recalculateFaces, layer)
    {
        if (collides === undefined) { collides = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetCollisionBetween(start, stop, collides, recalculateFaces, layer);

        return this;
    },

    setCollisionByProperty: function (properties, collides, recalculateFaces, layer)
    {
        if (collides === undefined) { collides = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetCollisionByProperty(properties, collides, recalculateFaces, layer);

        return this;
    },

    setCollisionByExclusion: function (indexes, collides, recalculateFaces, layer)
    {
        if (collides === undefined) { collides = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetCollisionByExclusion(indexes, collides, recalculateFaces, layer);

        return this;
    },

    setCollisionFromCollisionGroup: function (collides, recalculateFaces, layer)
    {
        if (collides === undefined) { collides = true; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetCollisionFromCollisionGroup(collides, recalculateFaces, layer);

        return this;
    },

    setTileIndexCallback: function (indexes, callback, callbackContext, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetTileIndexCallback(indexes, callback, callbackContext, layer);

        return this;
    },

    setTileLocationCallback: function (tileX, tileY, width, height, callback, callbackContext, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SetTileLocationCallback(tileX, tileY, width, height, callback, callbackContext, layer);

        return this;
    },

    setLayer: function (layer)
    {
        var index = this.getLayerIndex(layer);

        if (index !== null)
        {
            this.currentLayerIndex = index;
        }

        return this;
    },

    setBaseTileSize: function (tileWidth, tileHeight)
    {
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.widthInPixels = this.width * tileWidth;
        this.heightInPixels = this.height * tileHeight;

        for (var i = 0; i < this.layers.length; i++)
        {
            this.layers[ i ].baseTileWidth = tileWidth;
            this.layers[ i ].baseTileHeight = tileHeight;

            var mapData = this.layers[ i ].data;
            var mapWidth = this.layers[ i ].width;
            var mapHeight = this.layers[ i ].height;

            for (var row = 0; row < mapHeight; row++)
            {
                for (var col = 0; col < mapWidth; col++)
                {
                    var tile = mapData[ row ][ col ];

                    if (tile !== null)
                    {
                        tile.setSize(undefined, undefined, tileWidth, tileHeight);
                    }
                }
            }
        }

        return this;
    },

    setLayerTileSize: function (tileWidth, tileHeight, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return this; }

        layer.tileWidth = tileWidth;
        layer.tileHeight = tileHeight;

        var mapData = layer.data;
        var mapWidth = layer.width;
        var mapHeight = layer.height;

        for (var row = 0; row < mapHeight; row++)
        {
            for (var col = 0; col < mapWidth; col++)
            {
                var tile = mapData[ row ][ col ];

                if (tile !== null)
                {
                    tile.setSize(tileWidth, tileHeight);
                }
            }
        }

        return this;
    },

    shuffle: function (tileX, tileY, width, height, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.Shuffle(tileX, tileY, width, height, layer);

        return this;
    },

    swapByIndex: function (indexA, indexB, tileX, tileY, width, height, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.SwapByIndex(indexA, indexB, tileX, tileY, width, height, layer);

        return this;
    },

    tileToWorldX: function (tileX, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.TileToWorldX(tileX, camera, layer);
    },

    tileToWorldY: function (tileY, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.TileToWorldY(tileY, camera, layer);
    },

    tileToWorldXY: function (tileX, tileY, vec2, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.TileToWorldXY(tileX, tileY, vec2, camera, layer);
    },

    getTileCorners: function (tileX, tileY, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.GetTileCorners(tileX, tileY, camera, layer);
    },

    weightedRandomize: function (weightedIndexes, tileX, tileY, width, height, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        TilemapComponents.WeightedRandomize(tileX, tileY, width, height, weightedIndexes, layer);

        return this;
    },

    worldToTileX: function (worldX, snapToFloor, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.WorldToTileX(worldX, snapToFloor, camera, layer);
    },

    worldToTileY: function (worldY, snapToFloor, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.WorldToTileY(worldY, snapToFloor, camera, layer);
    },

    worldToTileXY: function (worldX, worldY, snapToFloor, vec2, camera, layer)
    {
        layer = this.getLayer(layer);

        if (layer === null) { return null; }

        return this._convert.WorldToTileXY(worldX, worldY, snapToFloor, vec2, camera, layer);
    },

    destroy: function ()
    {
        this.removeAllLayers();

        this.tiles.length = 0;
        this.tilesets.length = 0;
        this.objects.length = 0;

        this.scene = null;
    }

});

module.exports = Tilemap;
