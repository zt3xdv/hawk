var Class = require('../utils/Class');
var Components = require('../gameobjects/components');
var CONST = require('./const/ORIENTATION_CONST');
var DeepCopy = require('../utils/object/DeepCopy');
var Rectangle = require('../geom/rectangle');

var Tile = new Class({

    Mixins: [
        Components.AlphaSingle,
        Components.Flip,
        Components.Visible
    ],

    initialize:

    function Tile (layer, index, x, y, width, height, baseWidth, baseHeight)
    {

        this.layer = layer;

        this.index = index;

        this.x = x;

        this.y = y;

        this.width = width;

        this.height = height;

        this.right;

        this.bottom;

        this.baseWidth = (baseWidth !== undefined) ? baseWidth : width;

        this.baseHeight = (baseHeight !== undefined) ? baseHeight : height;

        this.pixelX = 0;

        this.pixelY = 0;

        this.updatePixelXY();

        this.properties = {};

        this.rotation = 0;

        this.collideLeft = false;

        this.collideRight = false;

        this.collideUp = false;

        this.collideDown = false;

        this.faceLeft = false;

        this.faceRight = false;

        this.faceTop = false;

        this.faceBottom = false;

        this.collisionCallback = undefined;

        this.collisionCallbackContext = this;

        this.tint = 0xffffff;

        this.tintFill = false;

        this.physics = {};
    },

    containsPoint: function (x, y)
    {
        return !(x < this.pixelX || y < this.pixelY || x > this.right || y > this.bottom);
    },

    copy: function (tile)
    {
        this.index = tile.index;
        this.alpha = tile.alpha;
        this.properties = DeepCopy(tile.properties);
        this.visible = tile.visible;
        this.setFlip(tile.flipX, tile.flipY);
        this.tint = tile.tint;
        this.rotation = tile.rotation;
        this.collideUp = tile.collideUp;
        this.collideDown = tile.collideDown;
        this.collideLeft = tile.collideLeft;
        this.collideRight = tile.collideRight;
        this.collisionCallback = tile.collisionCallback;
        this.collisionCallbackContext = tile.collisionCallbackContext;

        return this;
    },

    getCollisionGroup: function ()
    {
        return this.tileset ? this.tileset.getTileCollisionGroup(this.index) : null;
    },

    getTileData: function ()
    {
        return this.tileset ? this.tileset.getTileData(this.index) : null;
    },

    getLeft: function (camera)
    {
        var tilemapLayer = this.tilemapLayer;

        if (tilemapLayer)
        {
            var point = tilemapLayer.tileToWorldXY(this.x, this.y, undefined, camera);

            return point.x;
        }

        return this.x * this.baseWidth;
    },

    getRight: function (camera)
    {
        var tilemapLayer = this.tilemapLayer;

        return (tilemapLayer) ? this.getLeft(camera) + this.width * tilemapLayer.scaleX : this.getLeft(camera) + this.width;
    },

    getTop: function (camera)
    {
        var tilemapLayer = this.tilemapLayer;

        if (tilemapLayer)
        {
            var point = tilemapLayer.tileToWorldXY(this.x, this.y, undefined, camera);

            return point.y;
        }

        return this.y * this.baseWidth - (this.height - this.baseHeight);
    },

    getBottom: function (camera)
    {
        var tilemapLayer = this.tilemapLayer;

        return tilemapLayer
            ? this.getTop(camera) + this.height * tilemapLayer.scaleY
            : this.getTop(camera) + this.height;
    },

    getBounds: function (camera, output)
    {
        if (output === undefined) { output = new Rectangle(); }

        output.x = this.getLeft(camera);
        output.y = this.getTop(camera);
        output.width = this.getRight(camera) - output.x;
        output.height = this.getBottom(camera) - output.y;

        return output;
    },

    getCenterX: function (camera)
    {
        return (this.getLeft(camera) + this.getRight(camera)) / 2;
    },

    getCenterY: function (camera)
    {
        return (this.getTop(camera) + this.getBottom(camera)) / 2;
    },

    intersects: function (x, y, right, bottom)
    {
        return !(
            right <= this.pixelX || bottom <= this.pixelY ||
            x >= this.right || y >= this.bottom
        );
    },

    isInteresting: function (collides, faces)
    {
        if (collides && faces)
        {
            return (this.canCollide || this.hasInterestingFace);
        }
        else if (collides)
        {
            return this.collides;
        }
        else if (faces)
        {
            return this.hasInterestingFace;
        }

        return false;
    },

    resetCollision: function (recalculateFaces)
    {
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        this.collideLeft = false;
        this.collideRight = false;
        this.collideUp = false;
        this.collideDown = false;

        this.faceTop = false;
        this.faceBottom = false;
        this.faceLeft = false;
        this.faceRight = false;

        if (recalculateFaces)
        {
            var tilemapLayer = this.tilemapLayer;

            if (tilemapLayer)
            {
                this.tilemapLayer.calculateFacesAt(this.x, this.y);
            }
        }

        return this;
    },

    resetFaces: function ()
    {
        this.faceTop = false;
        this.faceBottom = false;
        this.faceLeft = false;
        this.faceRight = false;

        return this;
    },

    setCollision: function (left, right, up, down, recalculateFaces)
    {
        if (right === undefined) { right = left; }
        if (up === undefined) { up = left; }
        if (down === undefined) { down = left; }
        if (recalculateFaces === undefined) { recalculateFaces = true; }

        this.collideLeft = left;
        this.collideRight = right;
        this.collideUp = up;
        this.collideDown = down;

        this.faceLeft = left;
        this.faceRight = right;
        this.faceTop = up;
        this.faceBottom = down;

        if (recalculateFaces)
        {
            var tilemapLayer = this.tilemapLayer;

            if (tilemapLayer)
            {
                this.tilemapLayer.calculateFacesAt(this.x, this.y);
            }
        }

        return this;
    },

    setCollisionCallback: function (callback, context)
    {
        if (callback === null)
        {
            this.collisionCallback = undefined;
            this.collisionCallbackContext = undefined;
        }
        else
        {
            this.collisionCallback = callback;
            this.collisionCallbackContext = context;
        }

        return this;
    },

    setSize: function (tileWidth, tileHeight, baseWidth, baseHeight)
    {
        if (tileWidth !== undefined) { this.width = tileWidth; }
        if (tileHeight !== undefined) { this.height = tileHeight; }
        if (baseWidth !== undefined) { this.baseWidth = baseWidth; }
        if (baseHeight !== undefined) { this.baseHeight = baseHeight; }

        this.updatePixelXY();

        return this;
    },

    updatePixelXY: function ()
    {
        var orientation = this.layer.orientation;

        if (orientation === CONST.ORTHOGONAL)
        {

            this.pixelX = this.x * this.baseWidth;
            this.pixelY = this.y * this.baseHeight;
        }
        else if (orientation === CONST.ISOMETRIC)
        {

            this.pixelX = (this.x - this.y) * this.baseWidth * 0.5;
            this.pixelY = (this.x + this.y) * this.baseHeight * 0.5;
        }
        else if (orientation === CONST.STAGGERED)
        {
            this.pixelX = this.x * this.baseWidth + this.y % 2 * (this.baseWidth / 2);
            this.pixelY = this.y * (this.baseHeight / 2);
        }
        else if (orientation === CONST.HEXAGONAL)
        {
            var staggerAxis = this.layer.staggerAxis;
            var staggerIndex = this.layer.staggerIndex;
            var len = this.layer.hexSideLength;
            var rowWidth;
            var rowHeight;

            if (staggerAxis === 'y')
            {
                rowHeight = ((this.baseHeight - len) / 2 + len);

                if (staggerIndex === 'odd')
                {
                    this.pixelX = this.x * this.baseWidth + this.y % 2 * (this.baseWidth / 2);
                }
                else
                {
                    this.pixelX = this.x * this.baseWidth - this.y % 2 * (this.baseWidth / 2);
                }

                this.pixelY = this.y * rowHeight;
            }
            else if (staggerAxis === 'x')
            {
                rowWidth = ((this.baseWidth - len) / 2 + len);

                this.pixelX = this.x * rowWidth;

                if (staggerIndex === 'odd')
                {
                    this.pixelY = this.y * this.baseHeight + this.x % 2 * (this.baseHeight / 2);
                }
                else
                {
                    this.pixelY = this.y * this.baseHeight - this.x % 2 * (this.baseHeight / 2);
                }
            }
        }

        this.right = this.pixelX + this.baseWidth;
        this.bottom = this.pixelY + this.baseHeight;

        return this;
    },

    destroy: function ()
    {
        this.collisionCallback = undefined;
        this.collisionCallbackContext = undefined;
        this.properties = undefined;
    },

    canCollide: {

        get: function ()
        {
            return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown || (this.collisionCallback !== undefined));
        }

    },

    collides: {

        get: function ()
        {
            return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown);
        }

    },

    hasInterestingFace: {

        get: function ()
        {
            return (this.faceTop || this.faceBottom || this.faceLeft || this.faceRight);
        }

    },

    tileset: {

        get: function ()
        {
            var tilemapLayer = this.layer.tilemapLayer;

            if (tilemapLayer)
            {
                var tileset = tilemapLayer.gidMap[this.index];

                if (tileset)
                {
                    return tileset;
                }
            }

            return null;
        }

    },

    tilemapLayer: {

        get: function ()
        {
            return this.layer.tilemapLayer;
        }

    },

    tilemap: {

        get: function ()
        {
            var tilemapLayer = this.tilemapLayer;

            return tilemapLayer ? tilemapLayer.tilemap : null;
        }

    }

});

module.exports = Tile;
