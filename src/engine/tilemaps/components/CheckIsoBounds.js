var Vector2 = require('../../math/Vector2');

var point = new Vector2();

var CheckIsoBounds = function (tileX, tileY, layer, camera)
{
    var tilemapLayer = layer.tilemapLayer;

    var cullPaddingX = tilemapLayer.cullPaddingX;
    var cullPaddingY = tilemapLayer.cullPaddingY;

    var pos = tilemapLayer.tilemap.tileToWorldXY(tileX, tileY, point, camera, tilemapLayer);

    return pos.x > camera.worldView.x + tilemapLayer.scaleX * layer.tileWidth * (-cullPaddingX - 0.5)
        && pos.x < camera.worldView.right + tilemapLayer.scaleX * layer.tileWidth * (cullPaddingX - 0.5)
        && pos.y > camera.worldView.y + tilemapLayer.scaleY * layer.tileHeight * (-cullPaddingY - 1.0)
        && pos.y < camera.worldView.bottom + tilemapLayer.scaleY * layer.tileHeight * (cullPaddingY - 0.5);
};

module.exports = CheckIsoBounds;
