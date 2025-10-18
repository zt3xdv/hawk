var Class = require('../utils/Class');
var Vector2 = require('../math/Vector2');

var Tileset = new Class({

    initialize:

    function Tileset (name, firstgid, tileWidth, tileHeight, tileMargin, tileSpacing, tileProperties, tileData, tileOffset)
    {
        if (tileWidth === undefined || tileWidth <= 0) { tileWidth = 32; }
        if (tileHeight === undefined || tileHeight <= 0) { tileHeight = 32; }
        if (tileMargin === undefined) { tileMargin = 0; }
        if (tileSpacing === undefined) { tileSpacing = 0; }
        if (tileProperties === undefined) { tileProperties = {}; }
        if (tileData === undefined) { tileData = {}; }

        this.name = name;

        this.firstgid = firstgid;

        this.tileWidth = tileWidth;

        this.tileHeight = tileHeight;

        this.tileMargin = tileMargin;

        this.tileSpacing = tileSpacing;

        this.tileProperties = tileProperties;

        this.tileData = tileData;

        this.tileOffset = new Vector2();

        if (tileOffset !== undefined)
        {
            this.tileOffset.set(tileOffset.x, tileOffset.y);
        }

        this.image = null;

        this.glTexture = null;

        this.rows = 0;

        this.columns = 0;

        this.total = 0;

        this.texCoordinates = [];
    },

    getTileProperties: function (tileIndex)
    {
        if (!this.containsTileIndex(tileIndex)) { return null; }

        return this.tileProperties[tileIndex - this.firstgid];
    },

    getTileData: function (tileIndex)
    {
        if (!this.containsTileIndex(tileIndex)) { return null; }

        return this.tileData[tileIndex - this.firstgid];
    },

    getTileCollisionGroup: function (tileIndex)
    {
        var data = this.getTileData(tileIndex);

        return (data && data.objectgroup) ? data.objectgroup : null;
    },

    containsTileIndex: function (tileIndex)
    {
        return (
            tileIndex >= this.firstgid &&
            tileIndex < (this.firstgid + this.total)
        );
    },

    getTileTextureCoordinates: function (tileIndex)
    {
        if (!this.containsTileIndex(tileIndex)) { return null; }

        return this.texCoordinates[tileIndex - this.firstgid];
    },

    setImage: function (texture)
    {
        this.image = texture;

        var frame = texture.get();

        var bounds = texture.getFrameBounds();

        this.glTexture = frame.source.glTexture;

        if (frame.width > bounds.width || frame.height > bounds.height)
        {
            this.updateTileData(frame.width, frame.height);
        }
        else
        {
            this.updateTileData(bounds.width, bounds.height, bounds.x, bounds.y);
        }

        return this;
    },

    setTileSize: function (tileWidth, tileHeight)
    {
        if (tileWidth !== undefined) { this.tileWidth = tileWidth; }
        if (tileHeight !== undefined) { this.tileHeight = tileHeight; }

        if (this.image)
        {
            this.updateTileData(this.image.source[0].width, this.image.source[0].height);
        }

        return this;
    },

    setSpacing: function (margin, spacing)
    {
        if (margin !== undefined) { this.tileMargin = margin; }
        if (spacing !== undefined) { this.tileSpacing = spacing; }

        if (this.image)
        {
            this.updateTileData(this.image.source[0].width, this.image.source[0].height);
        }

        return this;
    },

    updateTileData: function (imageWidth, imageHeight, offsetX, offsetY)
    {
        if (offsetX === undefined) { offsetX = 0; }
        if (offsetY === undefined) { offsetY = 0; }

        var rowCount = (imageHeight - this.tileMargin * 2 + this.tileSpacing) / (this.tileHeight + this.tileSpacing);
        var colCount = (imageWidth - this.tileMargin * 2 + this.tileSpacing) / (this.tileWidth + this.tileSpacing);

        if (rowCount % 1 !== 0 || colCount % 1 !== 0)
        {
            console.warn('Image tile area not tile size multiple in: ' + this.name);
        }

        rowCount = Math.floor(rowCount);
        colCount = Math.floor(colCount);

        this.rows = rowCount;
        this.columns = colCount;

        this.total = rowCount * colCount;

        this.texCoordinates.length = 0;

        var tx = this.tileMargin + offsetX;
        var ty = this.tileMargin + offsetY;

        for (var y = 0; y < this.rows; y++)
        {
            for (var x = 0; x < this.columns; x++)
            {
                this.texCoordinates.push({ x: tx, y: ty });
                tx += this.tileWidth + this.tileSpacing;
            }

            tx = this.tileMargin + offsetX;
            ty += this.tileHeight + this.tileSpacing;
        }

        return this;
    }

});

module.exports = Tileset;
