var SnapCeil = require('../../math/snap/SnapCeil');
var SnapFloor = require('../../math/snap/SnapFloor');

var HexagonalCullBounds = function (layer, camera)
{
    var tilemap = layer.tilemapLayer.tilemap;
    var tilemapLayer = layer.tilemapLayer;

    var tileW = Math.floor(tilemap.tileWidth * tilemapLayer.scaleX);
    var tileH = Math.floor(tilemap.tileHeight * tilemapLayer.scaleY);

    var len = layer.hexSideLength;

    var boundsLeft;
    var boundsRight;
    var boundsTop;
    var boundsBottom;

    if (layer.staggerAxis === 'y')
    {
        var rowH = ((tileH - len) / 2 + len);

        boundsLeft = SnapFloor(camera.worldView.x - tilemapLayer.x, tileW, 0, true) - tilemapLayer.cullPaddingX;
        boundsRight = SnapCeil(camera.worldView.right - tilemapLayer.x, tileW, 0, true) + tilemapLayer.cullPaddingX;

        boundsTop = SnapFloor(camera.worldView.y - tilemapLayer.y, rowH, 0, true) - tilemapLayer.cullPaddingY;
        boundsBottom = SnapCeil(camera.worldView.bottom - tilemapLayer.y, rowH, 0, true) + tilemapLayer.cullPaddingY;
    }
    else
    {
        var rowW = ((tileW - len) / 2 + len);

        boundsLeft = SnapFloor(camera.worldView.x - tilemapLayer.x, rowW, 0, true) - tilemapLayer.cullPaddingX;
        boundsRight = SnapCeil(camera.worldView.right - tilemapLayer.x, rowW, 0, true) + tilemapLayer.cullPaddingX;

        boundsTop = SnapFloor(camera.worldView.y - tilemapLayer.y, tileH, 0, true) - tilemapLayer.cullPaddingY;
        boundsBottom = SnapCeil(camera.worldView.bottom - tilemapLayer.y, tileH, 0, true) + tilemapLayer.cullPaddingY;
    }

    return {
        left: boundsLeft,
        right: boundsRight,
        top: boundsTop,
        bottom: boundsBottom
    };
};

module.exports = HexagonalCullBounds;
