var AnimationState = require('../../animations/AnimationState');
var Class = require('../../utils/Class');
var GenerateGridVerts = require('../../geom/mesh/GenerateGridVerts');
var IntegerToRGB = require('../../display/color/IntegerToRGB');
var Mesh = require('../mesh/Mesh');
var UUID = require('../../utils/string/UUID');

var Plane = new Class({

    Extends: Mesh,

    initialize:

    function Plane (scene, x, y, texture, frame, width, height, tile)
    {
        if (!texture) { texture = '__DEFAULT'; }

        Mesh.call(this, scene, x, y, texture, frame);

        this.type = 'Plane';

        this.anims = new AnimationState(this);

        this.gridWidth;

        this.gridHeight;

        this.isTiled;

        this._checkerboard = null;

        this.hideCCW = false;

        this.setGridSize(width, height, tile);
        this.setSizeToFrame(false);
        this.setViewHeight();
    },

    originX: {

        get: function ()
        {
            return 0.5;
        }

    },

    originY: {

        get: function ()
        {
            return 0.5;
        }

    },

    setGridSize: function (width, height, tile)
    {
        if (width === undefined) { width = 8; }
        if (height === undefined) { height = 8; }
        if (tile === undefined) { tile = false; }

        var flipY = false;

        if (tile)
        {
            flipY = true;
        }

        this.gridWidth = width;
        this.gridHeight = height;
        this.isTiled = tile;

        this.clear();

        GenerateGridVerts({
            mesh: this,
            widthSegments: width,
            heightSegments: height,
            isOrtho: false,
            tile: tile,
            flipY: flipY
        });

        return this;
    },

    setSizeToFrame: function (resetUV)
    {
        if (resetUV === undefined) { resetUV = true; }

        var frame = this.frame;

        this.setPerspective(this.width / frame.width, this.height / frame.height);

        if (this._checkerboard && this._checkerboard !== this.texture)
        {
            this.removeCheckerboard();
        }

        if (!resetUV)
        {
            return this;
        }

        var gridX = this.gridWidth;
        var gridY = this.gridHeight;

        var verts = this.vertices;

        var frameU0 = frame.u0;
        var frameU1 = frame.u1;
        var frameV0 = frame.v0;
        var frameV1 = frame.v1;

        var x;
        var y;
        var i = 0;

        if (this.isTiled)
        {

            frameV0 = frame.v1;
            frameV1 = frame.v0;

            for (y = 0; y < gridY; y++)
            {
                for (x = 0; x < gridX; x++)
                {
                    verts[i++].setUVs(frameU0, frameV1);
                    verts[i++].setUVs(frameU0, frameV0);
                    verts[i++].setUVs(frameU1, frameV1);
                    verts[i++].setUVs(frameU0, frameV0);
                    verts[i++].setUVs(frameU1, frameV0);
                    verts[i++].setUVs(frameU1, frameV1);
                }
            }
        }
        else
        {
            var gridX1 = gridX + 1;
            var gridY1 = gridY + 1;

            var frameU = frameU1 - frameU0;
            var frameV = frameV1 - frameV0;

            var uvs = [];

            for (y = 0; y < gridY1; y++)
            {
                for (x = 0; x < gridX1; x++)
                {
                    var tu = frameU0 + frameU * (x / gridX);
                    var tv = frameV0 + frameV * (y / gridY);

                    uvs.push(tu, tv);
                }
            }

            for (y = 0; y < gridY; y++)
            {
                for (x = 0; x < gridX; x++)
                {
                    var a = (x + gridX1 * y) * 2;
                    var b = (x + gridX1 * (y + 1)) * 2;
                    var c = ((x + 1) + gridX1 * (y + 1)) * 2;
                    var d = ((x + 1) + gridX1 * y) * 2;

                    verts[i++].setUVs(uvs[a], uvs[a + 1]);
                    verts[i++].setUVs(uvs[b], uvs[b + 1]);
                    verts[i++].setUVs(uvs[d], uvs[d + 1]);
                    verts[i++].setUVs(uvs[b], uvs[b + 1]);
                    verts[i++].setUVs(uvs[c], uvs[c + 1]);
                    verts[i++].setUVs(uvs[d], uvs[d + 1]);
                }
            }
        }

        return this;
    },

    setViewHeight: function (value)
    {
        if (value === undefined) { value = this.frame.height; }

        var vFOV = this.fov * (Math.PI / 180);

        this.viewPosition.z = (this.height / value) / (Math.tan(vFOV / 2));

        this.dirtyCache[10] = 1;
    },

    createCheckerboard: function (color1, color2, alpha1, alpha2, height)
    {
        if (color1 === undefined) { color1 = 0xffffff; }
        if (color2 === undefined) { color2 = 0x0000ff; }
        if (alpha1 === undefined) { alpha1 = 255; }
        if (alpha2 === undefined) { alpha2 = 255; }
        if (height === undefined) { height = 128; }

        var c1 = IntegerToRGB(color1);
        var c2 = IntegerToRGB(color2);

        var colors = [];

        for (var h = 0; h < 16; h++)
        {
            for (var w = 0; w < 16; w++)
            {
                if ((h < 8 && w < 8) || (h > 7 && w > 7))
                {
                    colors.push(c1.r, c1.g, c1.b, alpha1);
                }
                else
                {
                    colors.push(c2.r, c2.g, c2.b, alpha2);
                }
            }
        }

        var texture = this.scene.sys.textures.addUint8Array(UUID(), new Uint8Array(colors), 16, 16);

        this.removeCheckerboard();

        this.setTexture(texture);

        this.setSizeToFrame();

        this.setViewHeight(height);

        return this;
    },

    removeCheckerboard: function ()
    {
        if (this._checkerboard)
        {
            this._checkerboard.destroy();

            this._checkerboard = null;
        }
    },

    play: function (key, ignoreIfPlaying)
    {
        return this.anims.play(key, ignoreIfPlaying);
    },

    playReverse: function (key, ignoreIfPlaying)
    {
        return this.anims.playReverse(key, ignoreIfPlaying);
    },

    playAfterDelay: function (key, delay)
    {
        return this.anims.playAfterDelay(key, delay);
    },

    playAfterRepeat: function (key, repeatCount)
    {
        return this.anims.playAfterRepeat(key, repeatCount);
    },

    stop: function ()
    {
        return this.anims.stop();
    },

    stopAfterDelay: function (delay)
    {
        return this.anims.stopAfterDelay(delay);
    },

    stopAfterRepeat: function (repeatCount)
    {
        return this.anims.stopAfterRepeat(repeatCount);
    },

    stopOnFrame: function (frame)
    {
        return this.anims.stopOnFrame(frame);
    },

    preUpdate: function (time, delta)
    {
        Mesh.prototype.preUpdate.call(this, time, delta);

        this.anims.update(time, delta);
    },

    preDestroy: function ()
    {
        this.clear();
        this.removeCheckerboard();

        this.anims.destroy();

        this.anims = undefined;

        this.debugCallback = null;
        this.debugGraphic = null;
    }

});

module.exports = Plane;
