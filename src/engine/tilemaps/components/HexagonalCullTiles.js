var CullBounds = require('./HexagonalCullBounds');
var RunCull = require('./RunCull');

var HexagonalCullTiles = function (layer, camera, outputArray, renderOrder)
{
    if (outputArray === undefined) { outputArray = []; }
    if (renderOrder === undefined) { renderOrder = 0; }

    outputArray.length = 0;

    var tilemapLayer = layer.tilemapLayer;

    var bounds = CullBounds(layer, camera);

    if (tilemapLayer.skipCull && tilemapLayer.scrollFactorX === 1 && tilemapLayer.scrollFactorY === 1)
    {
        bounds.left = 0;
        bounds.right = layer.width;
        bounds.top = 0;
        bounds.bottom = layer.height;
    }

    RunCull(layer, bounds, renderOrder, outputArray);

    return outputArray;
};

module.exports = HexagonalCullTiles;
